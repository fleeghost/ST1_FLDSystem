(function(){
    const {ipcRenderer} = require('electron')
    const {SystemModules,SelfModules,SelfService} = require(ipcRenderer.sendSync('getRootPath')+'/assembly/RequireHelper.js')
    const Sequelize = SystemModules('sequelize');
    const Config = require(ipcRenderer.sendSync('getRootPath')+'/config/config.json')
    const DbModel = require(ipcRenderer.sendSync('getRootPath')+'/config/dbModel.js')
    const Op = Sequelize.Op

    const operatorsAliases = {
        $eq: Op.eq,
        $ne: Op.ne,
        $gte: Op.gte,
        $gt: Op.gt,
        $lte: Op.lte,
        $lt: Op.lt,
        $not: Op.not,
        $in: Op.in,
        $notIn: Op.notIn,
        $is: Op.is,
        $like: Op.like,
        $notLike: Op.notLike,
        $iLike: Op.iLike,
        $notILike: Op.notILike,
        $regexp: Op.regexp,
        $notRegexp: Op.notRegexp,
        $iRegexp: Op.iRegexp,
        $notIRegexp: Op.notIRegexp,
        $between: Op.between,
        $notBetween: Op.notBetween,
        $overlap: Op.overlap,
        $contains: Op.contains,
        $contained: Op.contained,
        $adjacent: Op.adjacent,
        $strictLeft: Op.strictLeft,
        $strictRight: Op.strictRight,
        $noExtendRight: Op.noExtendRight,
        $noExtendLeft: Op.noExtendLeft,
        $and: Op.and,
        $or: Op.or,
        $any: Op.any,
        $all: Op.all,
        $values: Op.values,
        $col: Op.col
    }

    const db = new Sequelize(Config.Db_Connection.dbName, Config.Db_Connection.dbAccount, Config.Db_Connection.dbPassword, {
        host: Config.Db_Connection.host,
        dialect: Config.Db_Connection.dialect, // 指定连接的数据库类型
        port: Config.Db_Connection.port,
        pool: {
            max: Config.Db_Connection.pool.max, // 连接池中最大连接数量
            min: Config.Db_Connection.pool.min, // 连接池中最小连接数量
            idle: Config.Db_Connection.pool.idle // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
        },
        operatorsAliases: operatorsAliases
    })
    //注入模型
    DbModel.defineModel(db);
    module.exports = db;
})()






