/**
 * @class Imobile.model.Direccion
 * @extends Ext.data.Model
 * El modelo de la direccion
 */
Ext.define('Imobile.model.Direccion', {
    extend: 'Ext.data.Model',
    config: {
        fields: [{
            name: 'id',
            type: 'int'
        },{
            name: 'idCliente',
            type: 'int'
        },{
            name: 'Calle',
            type: 'string'
        },{
            name: 'NoExterior',
            type: 'string'
        }, {
            name: 'NoInterior',
            type: 'string'
        },{
            name: 'Colonia',
            type: 'string'
        },{
            name: 'Municipio',
            type: 'string'
        },{
            name: 'CodigoPostal',
            type: 'int'
        },{
            name: 'Ciudad',
            type: 'string'
        },{
            name: 'Estado',
            type: 'string'
        },{
            name: 'Pais',
            type: 'string'
        },{
            name: 'TipoDireccion', //La B es la dirección de entrega y S es la dirección fiscal
            type: 'string'
        }]
    }
});