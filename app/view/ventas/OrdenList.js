Ext.define('Imobile.view.ventas.OrdenList', {
    extend: 'Ext.dataview.List',
    xtype: 'ordenlist',
    requires: [],
    config: {
        itemCls: 'partida',
        itemTpl: ['<div>',
            '<span style="float: left; padding: 15px 0px 0px 10px;"><i class="fa fa-shopping-cart" style="font-size: 30px;"></i></span><span style="float: left; padding: 0 35px;" class="imobile-cliente-tpl">',
            '<p style="margin: 0px;">{CodigoArticulo}</p>',
            '<p style="margin: 0px;"><b>{NombreArticulo}</b></p>',
            '<p style="margin: 0px; color: red;">Quantity: <b>{cantidad}</b></p>',
            '</span>',
            '<span>',
            '<p style="margin: 0px;">Precio: {Precio}</p>',
            '<p style="margin: 0px;">Disc: {descuento}</p>',
            '<p style="margin: 0px;" class="total-product"><b>Total: {importe}</b></p>',
            '</span></div>'].join(''),
        store: 'Ordenes',
        emptyText: '<div style="float: left;"><div id="cliente_id" style="margin-left: 34px;"></div><div id="codigo_id"></div></div>'
    },

    onItemDisclosure: function (record, listItem, index, e) {
            this.fireEvent("tap", record, listItem, index, e); 
    }
});