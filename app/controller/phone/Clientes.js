/**
 * Created by th3gr4bb3r on 7/23/14.
 */
/**
 * Created by th3gr4bb3r on 7/21/14.
 */
Ext.define('APP.controller.phone.Clientes', {
    extend: 'Ext.app.Controller',

    config: {
        refs: {
            clientesList:'clienteslist'
        },
        control: {
            'clienteslist #buscarClientes': {
                clearicontap: 'limpiaBusquedaClientes'
            },
            'clienteslist #btnBuscarClientes': {
                tap: 'onBuscaClientes'
            },
            'clienteslist':{
                activate: function(list){
                    list.getStore().resetCurrentPage();
                    list.getStore().load();
                }
            }
        }
    },



    onBuscaClientes: function (t, e, eOpts) {
        var store = Ext.getStore('Clientes'),
            value = t.up('toolbar').down('#buscarClientes').getValue();
        //value = t.getValue();

        Ext.getStore('Clientes').resetCurrentPage();

        store.setParams({
            Criterio: value
        });
        store.load();
    },

    limpiaBusquedaClientes: function (t, e, eOpts) {
        var store = Ext.getStore('Clientes');

        Ext.getStore('Clientes').resetCurrentPage();

        store.setParams({
            Criterio: ''
        });
        store.load();
    },
});