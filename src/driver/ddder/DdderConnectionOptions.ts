/**
 * Created by zhiyuan.huang@ddder.net.
 */

import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";

export interface DdderConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     * */
    readonly type: "ddder";

    /**
     * Database name.
     * */
    readonly database: string;
}