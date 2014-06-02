Ext.define('Imobile.view.ventas.OrdenContainer', {
    extend: 'Ext.Container',
    xtype: 'ordencontainer',
    config: {
        layout: 'hbox',
        items: [{
            xtype: 'container',
            html: 'Descuento',
            flex: 1,
            itemId: 'descuento',
            style: {
                background: '#696969',
                'color': 'white',
                'margin-right': '1px',
                'text-align': 'center',
                'font-weight':'bold',
                'vertical-align': 'middle'
            }
        },{
            xtype: 'container',
            html: 'Subtotal',
            flex: 1,
            itemId: 'subtotal',
            style: {
                background: '#696969',
                'color': 'white',
                'margin-right': '1px',
                'text-align': 'center',
                'font-weight':'bold'
            }
        },{
            xtype: 'container',
            html: 'TAX',
            flex: 1,
            itemId: 'tax',
            style: {
                background: '#696969',
                'color': 'white',
                'margin-right': '1px',
                'text-align': 'center',
                'font-weight':'bold'
            }
        },{
            xtype: 'container',
            html: 'Total',
            flex: 1,
            itemId: 'total',
            style: {
                background: '#A9A9A9',
                'color': 'black',
                'margin-right': '1px',
                'text-align': 'center',
                'font-weight':'bold'
            }
        }]
    }
});