/*
 * @Author: your name
 * @Date: 2019-11-07 10:28:03
 * @LastEditTime: 2019-11-07 10:29:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \ST1_FLDSystem\app\assets\utils\vue-tree.js
 */
Vue.component('menu-template-sub', {
    props: ['menu_data'],
    template: '<div>' +
        '<div v-for="(row,index) in menu_data">' +
        '<el-submenu v-if="row.node.length" :index="\'self\' + row.Id">' +
        // '<span slot="title">{{row.Name}}</span>' +
        '<template slot="title"><i class="iconfont icon-menu" style="margin-right:10px;font-size:16px;"></i><span slot="title">{{row.Name}}</span></template>' +
        '<menu-template-sub :menu_data="row.node" @sub-item-click="menuItemClick"></menu-template-sub>' +
        '</el-submenu>' +
        '<el-menu-item v-else :index="\'self\' + row.Id" @click="menuItemClick(row)">'+
        // '{{row.Name}}'+
        '<i class="iconfont icon-menu" style="margin-right:10px;font-size:16px;"></i>' +
        '<span slot="title">{{row.Name}}</span>' +
        '</el-menu-item>' +
        '</div>' +
        '</div>',
    methods: {
        menuItemClick(row) {
            this.$emit('sub-item-click', row);
        }
    }
})
Vue.component('menu-template', {
    props: ['menu_data', 'collapse', 'openeds','undealformcount','undealapplycount'],
    template: '<el-menu background-color="transparent" text-color="#fff" active-text-color="#fff" :collapse="collapse" :default-openeds="openeds" class="el-menu-vertical-demo">' +
        '<el-submenu v-for="(row,index) in menu_data" v-if="row.node.length" :index="\'self\' + row.Id">' +
        '<template slot="title"><i class="iconfont" :class="row.ImageUrl" style="margin-right:10px;font-size:16px;"></i><span slot="title">{{row.Name}}</span></template>' +
        '<menu-template-sub :menu_data="row.node" class="bg-opacity" @sub-item-click="menuItemClick" ></menu-template-sub>' +
        '</el-submenu>' +
        '<el-menu-item v-else :index="\'self\' + row.Id" @click="menuItemClick(row)">' +
        '<i class="iconfont" :class="row.ImageUrl" style="margin-right:10px;font-size:16px;"></i>' +
        '<span slot="title">{{row.Name}}</span><el-badge class="mark" :value="row.Name==\'待处理表单\'?undealformcount:undealapplycount" style="float:right" v-if="row.Name==\'待处理表单\'||row.Name==\'待审批表单\'"  />' +
        '</el-menu-item>' +
        '</el-menu>',
    methods: {
        menuItemClick(row) {
            this.$emit('item-click', row);
        }
    }

})