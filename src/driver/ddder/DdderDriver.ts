/**
 * Created by zhiyuan.huang@ddder.net.
 */

import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { DdderConnectionOptions } from "./DdderConnectionOptions";
import { DdderQueryRunner } from "./DdderQueryRunner";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { Connection } from "../../connection/Connection";
import { DriverOptionNotSetError } from "../../error/DriverOptionNotSetError";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";

export class DdderDriver extends AbstractSqliteDriver {
    options: DdderConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        this.database = this.options.database;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load sqlite package
        this.loadDependencies();
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close().then(ok, fail);
        });
    }

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        return new Promise<void>(async (ok, fail) => {
            try {
                const databaseConnection = await this.sqlite.openDatabase(this.options.database);

                try {
                    await databaseConnection.exec(`PRAGMA foreign_keys = ON;`);
                    ok(databaseConnection);
                } catch (err) {
                    fail(err);
                }
            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master"|"slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new DdderQueryRunner(this);

        return this.queryRunner;
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = require("ddder-sqlite-storage");

        } catch (e) {
            throw new DriverPackageNotInstalledError("Ddder", "ddder-sqlite-storage");
        }
    }
}