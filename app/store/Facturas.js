/**
 * @class Imobile.store.Facturas
 * @extends Ext.data.Store
 * Este es el store para las facturas
 */
Ext.define('Imobile.store.Facturas', {
    extend: 'Ext.data.Store',
    requires: ['Imobile.model.Factura'],

    config: {
        model: 'Imobile.model.Factura',
        autoLoad: true,
        /*proxy: {
            url: 'http://192.168.15.8:88/iMobile/COK1_CL_Socio/ObtenerListaSocios',
            type: 'jsonp',
            callbackKey: 'callback',
            reader: {
                type: 'json',
                rootProperty: 'Data'

            }*/
        data: [
            {id: '0001', fecha: '23-May-2014', saldo: '10,000.00 MXP', vencimiento: '12-Dic-2014'},
            {id: '0002', fecha: '12-Abr-2014', saldo: '20,000.00 MXP', vencimiento: '14-Jun-2014'},
            {id: '0003', fecha: '28-Ene-2014', saldo: '30,000.00 MXP', vencimiento: '23-Jul-2014'},
            {id: '0004', fecha: '30-Mar-2013', saldo: '40,000.00 MXP', vencimiento: '13-Ago-2014'},
            {id: '0005', fecha: '23-Oct-2013', saldo: '50,000.00 MXP', vencimiento: '15-Dic-2014'}
        ]
    }
});