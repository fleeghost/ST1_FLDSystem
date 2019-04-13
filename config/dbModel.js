(function(){
    const {ipcRenderer} = require('electron')
    const {SystemModules,SelfModules,SelfService} = require(ipcRenderer.sendSync('getRootPath')+'/assembly/RequireHelper.js')
    const Sequelize = SystemModules('sequelize');


    module.exports.defineModel =(db)=>{
        db.SF_User = db.define('SF_User', {
            Id: {
                primaryKey:true,
                autoIncrement:true,
                type: Sequelize.INTEGER
            },
            Name:{
                type: Sequelize.STRING
            },
            Pwd:{
                type: Sequelize.STRING
            },
            Telphone:{
                type: Sequelize.STRING
            },
            HeadImg:{
                type: Sequelize.STRING
            },
            Sign:{
                type: Sequelize.STRING
            },
            Enabled:{
                type: Sequelize.INTEGER
            }
        },{
            tableName:'SF_User',
            timestamps:false
        })
    }

})()