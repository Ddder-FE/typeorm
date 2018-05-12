/**
 * Created by zhiyuan.huang@ddder.net.
 */

import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { DdderDriver } from "./DdderDriver";
import { Broadcaster } from "../../subscriber/Broadcaster";

export class DdderQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     * */
    driver: DdderDriver;

    constructor(driver: DdderDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    /**
     * Executes a given SQL query.
     * */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const connection = this.driver.connection;

        return new Promise<any[]>(async (ok, fail) => {
            let isInsertQuery: boolean,
                isSelectQuery: boolean;

            const handler = function (err: any, result: any) {

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (err) {
                    connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                } else {
                    ok(isInsertQuery ? result[1] : result);
                }
            };

            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();

            isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            isSelectQuery = query.substr(0, 6) === "SELECT";

            if (isSelectQuery) {
                databaseConnection.fetch(query, parameters).then((result: any) => {
                    handler(undefined, result);
                }, (err: any) => {
                    handler(err, undefined);
                });
            } else {
                databaseConnection.exec(query, parameters).then((result: any) => {
                    handler(undefined, result);
                }, (err: any) => {
                    handler(err, undefined);
                });
            }
        });
    }
}