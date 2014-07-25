/**
 * Created by th3gr4bb3r on 7/21/14.
 */
Ext.define('APP.controller.phone.Ordenes', {
    extend: 'Ext.app.Controller',

    config:{
        refs:{
            menuNav:'menunav',
            mainCard:'maincard',
            navigationOrden:'navigationorden',
            partidaContainer:'partidacontainer',
            opcionesOrden:'opcionesorden',
            ordenContainer:'ordencontainer',
            opcionesOrden: 'opcionesorden'

        },
    	control:{
            'container[id=ordenescont] clienteslist': {
                itemtap: 'alSelecionarCliente'
            },
            'opcionordeneslist': {
                itemtap: 'onOpcionOrdenes'
            },
            'opcionesorden #eliminar': {
                activate: 'onEliminarOrden'
            },
            'opcionesorden': {
                activeitemchange: 'cambiaItem'
            },

			'productoslist #btnBuscarProductos': {
                tap: 'onBuscaProductos'
            },
            'productoslist #buscarProductos': {
                clearicontap: 'limpiaBusquedaProductos'
            },
            'navigationOrden #agregarProductos': {
                tap: 'onAgregarPartida'
            },
            'navigationorden': {
                pop: 'onPopNavigationOrden',
                //back: 'onBack',
                //push: 'onPushNavigationOrden'
            },
            'agregarproductosform #agregar': {
                tap: 'agregaProductos'
            },
            'agregarproductosform #cantidad': {
                change: 'actualizaCantidad'
            },
            'agregarproductosform #almacenProducto': {
                focus: 'onListAlmacen'
            },
            'productosorden #listaProductos': {
                tap: 'mostrarListaProductos'
            },
            'productosorden #panelProductos': {
                tap: 'mostrarPanelProductos'
            },
            'productosorden productoslist': {
                itemtap: 'onAgregarProducto'
            },
            'productosorden productosview': {
                itemtap: 'onAgregarProducto'
            },            

            'direccioneslist': {
                itemtap: 'muestraDirecciones'
            },
            'ordenlist': {
                itemswipe: 'eliminaPartida',
                itemtap: 'editarPartida'
            },
            'opcionesorden #terminar': {
                activate: 'confirmaTerminarOrden'
            },
            'clientecontainer #guardar': {
                tap: 'guardaDatosDeCliente'
            },
            'editarpedidoform #moneda': {
                focus: 'muestraMonedas'
            },
            'tpldirecciones': {
                itemtap: 'seleccionaDireccion'
            },
            'monedaslist': {
                itemtap: 'seleccionaMoneda'
            },
            'transaccionlist': {
                itemtap: 'onSeleccionarTransaccion'
            },
            'almacenlist': {
                itemtap: 'onSeleccionarAlmacen'            
            }    		
    	}
    },

    /**
     * Establece el título y el id del cliente cada uno en una variable.
     * Muestra la vista de ventas.
     * @param list Ésta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record El record asociado al ítem.
     */
     alSelecionarCliente: function (list, index, target, record) {

        var name = record.get('NombreSocio'),
            idCliente = record.get('CodigoSocio'),
            titulo = name,
            barraTitulo = ({
                xtype: 'toolbar',
                docked: 'top',
                title: titulo
            });

        this.getMenuNav().push({
            xtype: 'opcionordeneslist',
            title: idCliente,
            idCliente: idCliente
        });

        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_Socio/ObtenerSocioiMobile",
            params: {
                CodigoUsuario: localStorage.getItem("CodigoUsuario"),
                CodigoSociedad: localStorage.getItem("CodigoSociedad"),
                CodigoDispositivo: localStorage.getItem("CodigoDispositivo"),
                Token: localStorage.getItem("Token"),
                CardCode: idCliente
            },
            callbackKey: 'callback',
            success: function (response) {
                var procesada = response.Procesada;

                var clienteSeleccionado = response.Data[0];

                this.getOpcionesOrden().clienteSeleccionado = clienteSeleccionado;

                if (procesada) {
                    this.estableceDirecciones(this.getMenuNav(),barraTitulo,clienteSeleccionado);
                } else {
                    Ext.Msg.alert('Datos Incorrectos', response.Descripcion, Ext.emptyFn);
                }
            },
            scope:this
        });
    },

    /**
     * Establece como predeterminadas las primeras direcciones que encuentra tanto fiscal
     * como de entrega, si este clienteme no tiene dirección fiscal manda un mensaje y no permite avanzar.
     * @param view La vista actual.
     * @param barraTitulo El toolbar para agregar el nombre del cliente.
     */
    estableceDirecciones: function (view,barraTitulo,clienteSeleccionado) {
        var me = this,            
            direcciones = Ext.getStore('Direcciones');

        direcciones.setData(clienteSeleccionado.Direcciones);
        direcciones.clearFilter();
        direcciones.filter('TipoDireccion', 'S');

        if (direcciones.getCount() > 0) {
            view.add(barraTitulo);

            me.getOpcionesOrden().direccionFiscal = direcciones.getAt(0).data.CodigoDireccion; // Se obtiene el codigo de la direccion fiscal y se lo asignamos a una propiedad del componente opcionesOrden
            me.getOpcionesOrden().codigoImpuesto = direcciones.getAt(0).data.CodigoImpuesto;
            me.getOpcionesOrden().tasaImpuesto = direcciones.getAt(0).data.Tasa;
            me.getOpcionesOrden().tipoCambio = 1;
            me.getOpcionesOrden().totalDeImpuesto = 0;

            direcciones.getAt(0).set('Predeterminado', true);
            direcciones.clearFilter();
            direcciones.filter('TipoDireccion', 'B');

            if (direcciones.getCount() > 0) {
                me.getOpcionesOrden().direccionEntrega = direcciones.getAt(0).data.CodigoDireccion; // Se obtiene el codigo de la direccion de entrega y se lo asignamos a una propiedad del componente opcionesOrden
                direcciones.getAt(0).set('Predeterminado', true);
            }

        } else {
            this.mandaMensaje('Sin dirección fiscal', 'Este cliente no cuenta con dirección fiscal, contacte a su administrador de SAP B1');
            view.pop();
            direcciones.removeAll();
        }
    },

    /**
     * Determina qué hacer dependiendo de la opción seleccionada.
     * Orden:
     *   Activa el ítem 2 del menú principal dejando la vista actual en navigationorden (con un sólo ítem, un tabpanel) y establece como activo el ítem 0 de este tabpanel.
     *   Hace aparecer un toolbar con el nombre del cliente.
     *
     * Visualizar:
     *
     * @param list Ésta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record EL record asociado a este ítem.
     */
    onOpcionOrdenes: function (list, index, target, record) {

        var me = this,
            menuNav = me.getMenuNav(),
            opcionesOrden = me.getOpcionesOrden(),
            opcion = record.get('action'),
            name = list.up()
            barraTitulo = ({
                xtype: 'toolbar',
                docked: 'top',
                title: menuNav.down('toolbar').getTitle()
            });            

        switch (opcion) {
            case 'orden':
                opcionesOrden.actionOrden = 'crear';
                this.getMainCard().getAt(1).setMasked(false);
                this.getMainCard().setActiveItem(1); // Activamos el item 1 del menu principal navigationorden
                this.getNavigationOrden().getNavigationBar().setTitle(list.idCliente); //Establecemos el title del menu principal como el mismo del menu de opciones
                this.getOpcionesOrden().setActiveItem(0); //Establecemos como activo el item 0 del tabpanel.
                this.getPartidaContainer().down('list').emptyTextCmp.show();

                this.dameMonedaPredeterminada();

                this.getNavigationOrden().add(barraTitulo);
                break;

            case 'visualizar':
                if (view.getActiveItem().xtype == 'transaccionlist') {
                    return;
                }

                opcionesOrden.actionOrden = 'actualizar';
                var store = Ext.getStore('Transacciones');

                Ext.getStore('Transacciones').resetCurrentPage();

                store.setParams({
                    CardCode: me.idCliente
                });

                store.load();

                view.push({
                    xtype: 'transaccionlist',
                    title: me.idCliente
                });

                me.dameMonedaPredeterminada();

                break;
        }
    },

    /**
     * Determina qué hacer al momento de cambiar el ítem del navigationorden:
     *   - Cliente: Obtiene los datos del cliente desde el JSON y llena las direcciones asignando por defecto la primera que aparece.
     * Aparece el botón Back y desaparece Agregar.
     *   - Editar: Establece valores para el formulario de editar pedido aparece el botón Back y desaparece Agregar.
     * @param tabPanel Este TabPanel
     * @param value El nuevo ítem
     * @param oldValue El ítem anterior
     */
    cambiaItem: function (tabPanel, value, oldValue) {
        var me = this,
            view = this.getNavigationOrden(),
            boton = view.getNavigationBar().down('#agregarProductos'),
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada,
            codigoMonedaPredeterminada = me.getOpcionesOrden().codigoMonedaPredeterminada,
            tipoCambio = me.getOpcionesOrden().tipoCambio,
            clienteSeleccionado = this.getOpcionesOrden().clienteSeleccionado;

        if (value.xtype == 'clientecontainer') {
            boton.setText('Back').show(); // Disfrazamos de back al botón agregar
            boton.setUi('back'); // Le ponemos el ícono de back

            var form = value.down('clienteform'),
                direcciones = Ext.getStore('Direcciones');

            clienteSeleccionado.LimiteCredito = parseFloat(clienteSeleccionado.LimiteCredito).toFixed(2);
            clienteSeleccionado.Saldo = parseFloat(clienteSeleccionado.Saldo).toFixed(2);

            form.setValues(clienteSeleccionado);
        }

        if (value.xtype == 'editarpedidoform') {
            if (codigoMonedaSeleccionada == codigoMonedaPredeterminada) {
                clienteSeleccionado.tipoCambio = parseFloat(1).toFixed(2);;
            } else {
                clienteSeleccionado.tipoCambio = parseFloat(tipoCambio).toFixed(2);
            }

            clienteSeleccionado.LimiteCredito = parseFloat(clienteSeleccionado.LimiteCredito).toFixed(2);
            clienteSeleccionado.Saldo = parseFloat(clienteSeleccionado.Saldo).toFixed(2);
            clienteSeleccionado.CodigoMoneda = codigoMonedaSeleccionada;            
            value.setValues(clienteSeleccionado);
            boton.setText('Back').show();
            boton.setUi('back');
        }

        if (value.xtype == 'partidacontainer') {
            boton.setText('Agregar').show();
            boton.setUi('normal');
        }
    },

    /**
    * Recorre el store de monedas y obtiene la predeterminada.
    */
    dameMonedaPredeterminada: function (){
        var me = this,
            storeMonedas = Ext.getStore('Monedas');

        storeMonedas.load({
            callback: function (records, operation) {
                Ext.Array.each(records, function (item, index, ItSelf) {
                    var predeterminada = item.get('Predeterminada');
                    if (predeterminada) {
                        me.getOpcionesOrden().codigoMonedaPredeterminada = codigoMonedaPredeterminada = item.get('CodigoMoneda') + ' ';
                        me.getOpcionesOrden().codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaPredeterminada;
                    }
                });
                me.actualizarTotales();
            }
        });
    },

    actualizarTotales: function () {
        var me = this,
            store = Ext.getStore('Ordenes'),
            precioTotal = 0,
            descuentoTotal = 0,
            total = 0,
            tax = 0,
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada;

        store.each(function (item) {
            precioTotal += APP.core.FormatCurrency.formatCurrencytoNumber(item.get('precioConDescuento')) * item.get('cantidad');

            // descuentoTotal += Imobile.core.FormatCurrency.formatCurrencytoNumber(item.get('descuento')) * item.get('cantidad');
            tax += item.get('totalDeImpuesto');

        });

        this.getOrdenContainer().down('#descuento').setItems({xtype: 'container', html: '<div style="top: 6px; position: relative;">' + codigoMonedaSeleccionada + '0.00</div>'}); //Imobile.core.FormatCurrency.currency(importe, '$')
        this.getOrdenContainer().down('#subtotal').setItems({xtype: 'container', html: '<div style="top: 6px; position: relative;">' + APP.core.FormatCurrency.currency(parseFloat(precioTotal), codigoMonedaSeleccionada)/*.toFixed(2)*/ + '</div>'});
        this.getOrdenContainer().down('#tax').setItems({xtype: 'container', html: '<div style="top: 6px; position: relative;">' + APP.core.FormatCurrency.currency(parseFloat(tax), codigoMonedaSeleccionada) + '</div>'});
        this.getOrdenContainer().down('#total').setItems({xtype: 'container', html: '<div style="top: 6px; position: relative;">' + APP.core.FormatCurrency.currency(parseFloat(precioTotal + tax), codigoMonedaSeleccionada) + '</div>' });
    },


    /**
     * Remueve todos los elementos del store de órdenes si el usuario lo confirma, en caso contrario muestra la vista
     * de la lista  órdenes sin eliminar nada.
     * @param newActiveItem El nuevo ítem activo dentro del contenedor.
     * @param tabPanel Éste tabpanel.
     */
    onEliminarOrden: function (newActiveItem, tabPanel) {
        var me = this,
            ordenes = Ext.getStore('Ordenes');
        Ext.Msg.confirm("Eliminar orden", "Se va a eliminar la orden, todos los productos agregados se perderán ¿está seguro?", function (e) {

            if (e == 'yes') {
                var view = this.getMainCard().getActiveItem(),
                    titulo = view.down('toolbar');

                ordenes.removeAll();
                this.getMainCard().setActiveItem(0);
                view.remove(titulo, true); // Remueve el título de la vista, si no, al volver a entrar aparecerá sobre el actual.
            } else {
                tabPanel.setActiveItem(0);
            }
        },this);
    },

    /**
     * Guarda el código de dirección de la dirección seleccionada, ya sea de entrega o fiscal.
     * @param list Ésta lista
     * @param index El índice de la dirección seleccionada
     * @param target El elemento tapeado
     * @param record El record asociado al ítem.
     */
    seleccionaDireccion: function (list, index, target, record) {
        var me = this,
            direcciones = Ext.getStore('Direcciones'),
            entrega = me.getOpcionesOrden().entrega,
            direccionFiscal = me.getOpcionesOrden().direccionFiscal,
            direccionEntrega = me.getOpcionesOrden().direccionEntrega,
            codigoImpuesto = me.getOpcionesOrden().codigoImpuesto,
            tasaImpuesto = me.getOpcionesOrden().tasaImpuesto,
            view = me.getNavigationOrden();

        direcciones.each(function (item, index, length) {
            item.set('Predeterminado', false)
        });

        direcciones.getAt(index).set('Predeterminado', true);

        if (entrega) {
            direccionEntrega = record.data.CodigoDireccion;
        } else {
            direccionFiscal = record.data.CodigoDireccion;
            codigoImpuesto = record.data.CodigoImpuesto;
            tasaImpuesto = record.data.Tasa;
        }
        view.pop();
    },

    /**
     * Muestra la lista de monedas.
     */
    muestraMonedas: function () {
        var me = this,
            view = me.getNavigationOrden();

        view.push({
            xtype: 'monedaslist'
        });

        view.getNavigationBar().down('#agregarProductos').hide()
    },

    /**
     * Al seleccionar la moneda regresa a la vista anterior (editarpedidoform) y setea el codigo de la moneda seleccionada.
     * @param list Ésta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record El record asociado al ítem.
     */
    seleccionaMoneda: function (list, index, target, record) {
        var me = this,
            view = me.getNavigationOrden(),
            moneda = record.get('CodigoMoneda') + ' ',
            opcionesOrden = me.getOpcionesOrden(),
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada,
            codigoMonedaPredeterminada = me.getOpcionesOrden().codigoMonedaPredeterminada,
            form = opcionesOrden.down('editarpedidoform');

        if ((codigoMonedaSeleccionada != moneda) && (codigoMonedaSeleccionada == codigoMonedaPredeterminada)) {
            if (me.dameProductoConMonedaPredeterminada(codigoMonedaPredeterminada) != 'No hay') {
                me.mandaMensaje('Error', 'No es posible cambiar la configuración debido a que la moneda del producto con código ' + me.dameProductoConMonedaPredeterminada() + ' es ' + codigoMonedaPredeterminada + '. Elimínelo primero de la orden.');
            } else {
                me.obtenerTipoCambio(moneda, record);
//                me.estableceMonedaPredeterminada(record);
//                me.actualizaOrden(moneda);
            }
        } else {

            if (moneda != codigoMonedaSeleccionada) {
                codigoMonedaSeleccionada = codigoMonedaPredeterminada;
                me.actualizaOrden(moneda);
                //me.tipoCambio = 1;
                form.setValues({
                    CodigoMoneda: codigoMonedaSeleccionada,
                    tipoCambio: parseFloat(1).toFixed(2)
                });
                me.estableceMonedaPredeterminada(record); // Para pintar la palomita.
            }
            //me.actualizarTotales();
        }

        view.pop();
    },

    /**
     * Obtiene el nombre del primer artículo encontrado cuyo codigo de moneda es la predeterminada.
     * @return El nombre del artículo o 'No hay' si no existe ninguno.
     */
    dameProductoConMonedaPredeterminada: function (codigoMonedaPredeterminada) {
        var me = this, i,
            nombre = 'No hay',
            ordenes = Ext.getStore('Ordenes');

        for (i = 0; i < ordenes.getCount(); i++) {
            console.log(ordenes.getAt(i).get('moneda'), 'moneda');
            console.log(codigoMonedaPredeterminada, 'predeterminada');
            if (ordenes.getAt(i).get('moneda') == codigoMonedaPredeterminada) {
                nombre = ordenes.getAt(i).get('CodigoArticulo');
                break;
            }
        }

        return nombre;
    },

    /**
     * Obtiene el tipo de cambio actual de acuerdo a la moneda que le pasan, este valor lo deja en la propiedad tipoCambio de opcionesOrden.
     * @param moneda La divisa cuyo tipo de cambio se necesita.
     */
    obtenerTipoCambio: function (moneda, record) {
        var me = this,             
            form = me.getOpcionesOrden().down('editarpedidoform'),
            tipoCambio = getOpcionesOrden().tipoCambio,
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada,
            view = me.getNavigationOrden().getActiveItem();

        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem('dirIP') + "/iMobile/COK1_CL_Consultas/RegresarTipoCambio",
            params: {
                CodigoUsuario: localStorage.getItem('CodigoUsuario'),
                CodigoSociedad: '001',
                CodigoDispositivo: '004',
                Token: localStorage.getItem("Token"),
                Criterio: moneda
            },
            callbackKey: 'callback',
            success: function (response) {
                if (response.Procesada) {
                    tipoCamio = parseFloat(response.Data[0]).toFixed(2);
                    
                    if (view.isXType('agregarproductosform')) {
                        me.ayudaAAgregar(view, 'monedaDiferente');
                        me.ayudaAAgregar(view, 'cantidad'); // Se modifica la cantidad sólo si el tipo de cambio es exitoso.
                    } else {
                        codigoMonedaSeleccionada = moneda;                        
                        form.setValues({
                            CodigoMoneda: moneda,
                            tipoCambio: tipoCambio
                        });
                        me.estableceMonedaPredeterminada(record); // Para pintar la palomita
                        me.actualizaOrden(moneda);
                        //me.actualizarTotales();
                    }

                } else {
                    var error = response.Descripcion;
                    me.mandaMensaje('Error', error);                    
                    // form.setValues({
                    //     CodigoMoneda: me.codigoMonedaSeleccionada,
                    //     tipoCambio: me.tipoCambio
                    // });
                }
            }
        });        
    },

    /**
     * Establece la moneda seleccionada como predeterminada para visualizarla en la lista de monedas.
     * @param record El record de la moneda seleccionada.
     */
    estableceMonedaPredeterminada: function (record) {
        var store = Ext.getStore('Monedas');

        store.each(function (item, index, length) {            
            item.set('Predeterminada', false);
        });
        record.set('Predeterminada', true);
    },

    /**
     * Actualiza los valores de cada una de las partidas respecto al tipo de cambio realizado.
     * @param moneda La moneda seleccionada.
     */
    actualizaOrden: function (moneda) {
        var me = this, precio, importe,
            codigoMonedaPredeterminada = me.getOpcionesOrden().codigoMonedaPredeterminada,
            tipoCambio = me.getOpcionesOrden().tipoCambio,
            ordenes = Ext.getStore('Ordenes');

        if(moneda == codigoMonedaPredeterminada){
                ordenes.each(function (item, index, length) {
                    precio = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('Precio')) * tipoCambio;
                    importe = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('importe')) * tipoCambio;
                    precio = APP.core.FormatCurrency.currency(precio, moneda);
                    importe = APP.core.FormatCurrency.currency(importe, moneda);

                    item.set('Precio', precio);
                    item.set('importe', importe);
                    item.set('totalDeImpuesto', item.get('totalDeImpuesto') * tipoCambio);
                });
                me.actualizarTotales();

            } else {

                ordenes.each(function (item, index, length) {
                    precio = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('Precio')) / tipoCambio;
                    importe = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('importe')) / tipoCambio;
                    precio = APP.core.FormatCurrency.currency(precio, moneda);
                    importe = APP.core.FormatCurrency.currency(importe, moneda);

                    item.set('Precio', precio);
                    item.set('importe', importe);
                    item.set('totalDeImpuesto', item.get('totalDeImpuesto') / tipoCambio);
                });
                me.actualizarTotales();
            }
    },

    /**
     * Elimina la partida seleccionada del store de órdenes.
     * @param list Ésta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record El record asociado al ítem.
     */
    eliminaPartida: function (list, index, target, record) {
        var me = this,
            ordenes = Ext.getStore('Ordenes');
        Ext.Msg.confirm("Eliminar producto de la orden", "Se va a eliminar el producto de la orden, ¿está seguro?", function (e) {

            if (e == 'yes') {
                var ind = ordenes.find('id', record.data.id);
                ordenes.removeAt(ind);
                me.actualizarTotales();

                if (ordenes.getData().items.length < 2) {
                    me.getPartidaContainer().down('list').emptyTextCmp.show();
                } else {
                    me.getPartidaContainer().down('list').emptyTextCmp.hide();
                }
            }
        });
    },

    /**
     * Muestra la lista de direcciones según se haya elegido, fiscal o de entrega.
     * @param list Ésta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record El record asociado al ítem.
     */
    muestraDirecciones: function (list, index, target, record) {
        var me = this,
            view = me.getNavigationOrden(),            
            direcciones = Ext.getStore('Direcciones');        

        direcciones.clearFilter();

        if (record.data.action == 'entrega') {
            direcciones.filter('TipoDireccion', 'B');
            me.getOpcionesOrden().entrega = true;
        } else {
            direcciones.filter('TipoDireccion', 'S');
            me.getOpcionesOrden().entrega = false;
        }

        view.push({
            xtype: 'tpldirecciones'
        });

        view.getNavigationBar().down('#agregarProductos').hide();
    },

    /**
     * Muesta la lista de productos.
     */
    mostrarListaProductos: function () {
        var me = this;
        Ext.getStore('Productos').clearFilter();
        me.getProductosOrden().setItems({xtype: 'productoslist'});
    },


    /**
     * Muestra el panel de productos.
     */
    mostrarPanelProductos: function () {
        var me = this,
            productos = Ext.getStore('Productos');

        me.lista(true);

        me.getProductosOrden().setItems({xtype: 'productosview'});

        setTimeout(function () { //Función para esperar algunos milisegundos y se pinten de colores los cuadros
            productos.each(function (item, index, length) {
                item.set('color', me.dameColorAleatorio());
            })
        }, 100)
    },

    aleatorio: function (inferior, superior) {
        var numPosibilidades = superior - inferior,
            aleat = Math.random() * numPosibilidades,
            aleat = Math.floor(aleat);

        return parseInt(inferior) + aleat;
    },

    dameColorAleatorio: function () {
        var hexadecimal = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"),
            color_aleatorio = "#",
            posarray;

        for (i = 0; i < 6; i++) {
            posarray = this.aleatorio(0, hexadecimal.length)
            color_aleatorio += hexadecimal[posarray]
        }
        return color_aleatorio
    },


    /**
     * Agrega el producto a la orden
     * @btn Este botón
     */
    agregaProductos: function (btn) {
        var form, values, descripcion, cantidad, ordenes,
            me = this,
            ordenes = Ext.getStore('Ordenes'),
            productos = Ext.getStore('Productos'),
            menu = me.getMain().getActiveItem(),     //NavigationOrden
            form = btn.up('agregarproductosform'),
            values = form.getValues(),
            descripcion = values.NombreArticulo,
            cantidad = values.cantidad,
            moneda = values.moneda,
            importe = values.importe,
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada;


        Ext.getStore('Productos').resetCurrentPage();
        if (Ext.isEmpty(descripcion) || Ext.isEmpty(cantidad)) {
            me.mandaMensaje("Campos inválidos o vacíos", "Verifique que el valor de los campos sea correcto o que no estén vacíos");
        } else {
            if (form.modo != 'edicion') {
                if (moneda != codigoMonedaSeleccionada) {
                    if (moneda == codigoMonedaPredeterminada) {
                        me.mandaMensaje('Imposible agregar', 'No es posible agregar el producto a la orden debido a que la configuración de moneda actual es ' + me.codigoMonedaSeleccionada + '  y la moneda del producto es ' + moneda + '. Cambie primero la configuración de moneda a ' + moneda + '.');
                    } else {
                        me.obtenerTipoCambio(moneda); // Aquí esperamos a que obtenga el tipo de cambio y realizamos el cálculo del nuevo precio.
                    }
                } else {
                    me.ayudaAAgregar(form, 'cantidad');
                    me.ayudaAAgregar(form, 'monedaIgual');
                }
            } else {
                me.ayudaAAgregar(form, 'cantidad');
                me.ayudaAAgregar(form, 'edicion');
            }
        }
    },

    /**
     * Función auxiliar para agregar los productos a la orden, en sí ésta hace toda la chamba de acuerdo al flujo en turno.
     */

    ayudaAAgregar: function (form, caso) {
        var values, descripcion, cantidad, ordenes, codigo, indPro, productoAgregado, cantidadActual, precio,
            me = this,
            ordenes = Ext.getStore('Ordenes'),
            productos = Ext.getStore('Productos'),
            menu = me.getNavigationOrden(),     //NavigationOrden
            values = form.getValues(),
            descripcion = values.NombreArticulo,
            cantidad = values.cantidad,
            moneda = values.moneda,
            importe = values.importe,
            codigo = values.CodigoArticulo,
            indPro = productos.find('CodigoArticulo', codigo),
            productoAgregado = productos.getAt(indPro),
            cantidadActual = productoAgregado.get('cantidad'),
            totalDeImpuesto = me.getOpcionesOrden().totalDeImpuesto,
            tipoCambio = me.getOpcionesOrden().tipoCambio,
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada;
        
        switch (caso) {
            case 'monedaIgual':
                values.totalDeImpuesto = totalDeImpuesto;
                values.Imagen = productoAgregado.get('Imagen');
                values.nombreMostrado = Ext.String.ellipsis(descripcion, 25, false);
                ordenes.add(values);
                menu.pop();
                me.actualizarTotales();
                break;

            case 'monedaDiferente':
                precio = APP.core.FormatCurrency.formatCurrencytoNumber(values.precioConDescuento) * tipoCambio;
                values.importe = precio * cantidad;
                precio = APP.core.FormatCurrency.currency(precio, codigoMonedaSeleccionada);
                values.precioConDescuento = precio;
                values.importe = APP.core.FormatCurrency.currency(values.importe, codigoMonedaSeleccionada);
                values.totalDeImpuesto = totalDeImpuesto * tipoCambio;
                //values.descuento = values.descuento;
                values.Imagen = productoAgregado.get('Imagen');
                values.nombreMostrado = Ext.String.ellipsis(descripcion, 25, false);
                values.TipoCambio = tipoCambio;
                ordenes.add(values);
                menu.pop();
                me.actualizarTotales();
                break;

            case 'edicion':
                var ind = form.ind,
                    datosProducto = ordenes.getAt(ind),
                    totaldeimpuesto,
                    moneda = values.moneda;

                if (moneda != codigoMonedaSeleccionada) {
                    precio = APP.core.FormatCurrency.formatCurrencytoNumber(values.precioConDescuento) * datosProducto.get('TipoCambio');
                    importe = precio * cantidad;
                    precio = APP.core.FormatCurrency.currency(precio, codigoMonedaSeleccionada);
                    importe = APP.core.FormatCurrency.currency(importe, codigoMonedaSeleccionada);
                    totaldeimpuesto = totalDeImpuesto * datosProducto.get('TipoCambio');
                    datosProducto.set('Precio', precio);
                    datosProducto.set('cantidad', cantidad);
                    datosProducto.set('importe', importe);
                    datosProducto.set('totalDeImpuesto', /*Imobile.core.FormatCurrency.currency(me.totalDeImpuesto, '$')*/ totalDeImpuesto);
                    //datosProducto.set('Imagen', cantidadProducto.get('Imagen'));
                    menu.pop();
                    me.actualizarTotales();
                } else {
                    datosProducto.set('cantidad', cantidad);
                    datosProducto.set('importe', importe);
                    datosProducto.set('totalDeImpuesto', /*Imobile.core.FormatCurrency.currency(me.totalDeImpuesto, '$')*/ totalDeImpuesto);
                    //datosProducto.set('Imagen', cantidadProducto.get('Imagen'));
                    menu.pop();
                    me.actualizarTotales();
                }
                break;

            case 'cantidad':
                var codigo = values.CodigoArticulo,
                    indPro = productos.find('CodigoArticulo', codigo),
                    productoAgregado = productos.getAt(indPro),
                    cantidadActual = productoAgregado.get('cantidad');

                productoAgregado.set('cantidad', cantidadActual + cantidad);
                break;
        }
    },

    /**
     * Obtiene desde el backend la lista de clientes.
     */
    muestraClientes: function () {
        var clientes = Ext.getStore('Clientes');
        
        clientes.resetCurrentPage();
        clientes.clearFilter();
        clientes.load();
    },

    /**
     * Muestra la lista de órdenes.
     */
    muestralistaOrden: function () {
        Ext.getStore('Ordenes').load();
    },

    onBuscaProductos: function (t, e, eOpts) {
        var me = this,
            store = Ext.getStore('Productos'),
            idCliente = me.getNavigationOrden().getNavigationBar().getTitle(),
            value = t.up('toolbar').down('#buscarProductos').getValue();


        store.resetCurrentPage();

        store.setParams({
            Criterio: value,
            CardCode: idCliente
        });

        store.load();
    },

    limpiaBusquedaProductos: function (t, e, eOpts) {
        var me = this,
            idCliente = me.getNavigationOrden().getNavigationBar().getTitle(),
            store = Ext.getStore('Productos');

        store.resetCurrentPage();

        store.setParams({
            Criterio: '',
            CardCode: idCliente
        });

        store.load();
    },

    /**
     * Filtra el store de productos por la variable DesplegarEnPanel.
     * @param desplegarEnPanel Variable booleana para indicar si se despliega en panel (true) o no (false).
     */
    lista: function (desplegarEnPanel) {
        var productos = Ext.getStore('Productos'),
            me = this;

        productos.clearFilter(); //Para limpiar todos los filtros por si tiene alguno el store
        productos.filter('DesplegarEnPanel', desplegarEnPanel);
    },

    /**
     * Muestra un mensaje al ususario con un alert.
     * @param titulo El título del alert.
     * @param mensaje El mensaje a mostrar.
     */
    mandaMensaje: function (titulo, mensaje) {
        Ext.Msg.alert(titulo, mensaje);
    },

    /**
     * Muestra el formulario para agregar un producto a la orden.
     * @param list Esta lista, productoslist.
     * @param index El índice del item tapeado.
     * @param target El elemento o DataItem tapeado.
     * @param record El record asociado al ítem.
     */
    onAgregarProducto: function (list, index, target, record, e) {
        var me = this,
            productos = Ext.getStore('Productos'),
            idCliente = me.getNavigationOrden().getNavigationBar().getTitle(),
            valores = record.data;
        //moneda,// = valores.ListaPrecios[0].CodigoMoneda,

        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_Articulo/ObtenerArticuloiMobile",
            params: {
                CodigoUsuario: localStorage.getItem("CodigoUsuario"),
                CodigoSociedad: localStorage.getItem("CodigoSociedad"),
                CodigoDispositivo: localStorage.getItem("CodigoDispositivo"),
                Token: localStorage.getItem("Token"),                
                CardCode: idCliente,                
                Criterio: valores.CodigoArticulo
            },
            callbackKey: 'callback',
            success: function (response) {
                var procesada = response.Procesada;

                if (procesada) {
                    var ind = productos.find('CodigoArticulo', valores.CodigoArticulo),
                        productoSeleccionado = productos.getAt(ind);

                    productoSeleccionado.set(response.Data[0]);

                    me.llenaAgregarProductos(response.Data[0]); // Hacer un console.log de esta parte para manipular adecuadamente los datos, se supone que me regresa el artículo.
                } else {
                    Ext.Msg.alert('Datos Incorrectos', response.Descripcion, Ext.emptyFn);
                }
            }
        });
    },    

    /**
    * Establece los valores del agregarproductosform
    * @param valores Los valores para el formulario.
    */
    llenaAgregarProductos: function (valores) {
        var me = this,
            view = me.getNavigationOrden(),
            idCliente = view.getNavigationBar().getTitle(),
            almacenes = localStorage.getItem("Almacenes"),
            precio,
            form,
            cantidad,
            valoresForm,
            desc,
            preciocondescuento,
            importe,
            codigoAlmacen,
            sujetoImpuesto = me.getOpcionesOrden().sujetoImpuesto,
            totalDeImPuesto = me.getOpcionesOrden().totalDeImpuesto,
            tasaImpuesto = me.getOpcionesOrden().tasaImpuesto,
            moneda = valores.ListaPrecios[0].CodigoMoneda + ' ';

        valores.Disponible = Ext.Number.toFixed(valores.Disponible, 2);

        if (view.getActiveItem().xtype == 'agregarproductosform') {
            return;
        }

        view.push({
            xtype: 'agregarproductosform',
            modo: 'agregar'
        });

        Ext.Array.forEach(almacenes, function (item, index) {
            var predeterminado = item.Predeterminado;

            if (predeterminado) {
                valores.NombreAlmacen = item.NombreAlmacen;
                codigoAlmacen = item.CodigoAlmacen;
            }
        });

        form = view.getActiveItem();

        form.setValues(valores);

        //Se establece el valor de cantidad, precio y moneda
        precio = APP.core.FormatCurrency.currency(valores.ListaPrecios[0].Precio, moneda);
        cantidad = 1;

        //Se calcula descuento
        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_Consultas/ObtenerPrecioEspecialiMobile",

            params: {
                CodigoUsuario: localStorage.getItem("CodigoUsuario"),
                CodigoSociedad: localStorage.getItem("CodigoSociedad"),
                CodigoDispositivo: localStorage.getItem("CodigoDispositivo"),
                Token: localStorage.getItem("Token"),
                ItemCode: valores.CodigoArticulo,
                CardCode: idCliente,
                ListaPrecio: valores.ListaPrecios[0].CodigoLista,
                Cantidad: cantidad
            },

            callbackKey: 'callback',
            success: function (response) {
                var procesada = response.Procesada,
                    precio2 = APP.core.FormatCurrency.formatCurrencytoNumber(precio);

                if (precio2 == 0) {
                    desc = 0;
                } else {
/*                    console.log(precio2);
                    console.log(response.Data[0]);*/
                    desc = (precio2 - response.Data[0]).toFixed(2);
                    // console.log(desc);
                    desc = (desc * 100 / precio2);
                    // console.log(desc);
                }

                if (procesada) {

                    //Se establece precio con descuento
                    preciocondescuento = response.Data[0];
                    sujetoImpuesto = valores.SujetoImpuesto;
                    //Se valida si el producto es sujeto de impuesto
                    if (sujetoImpuesto) {
                        //Se calcula total de impuesto
                        totalDeImpuesto = preciocondescuento * tasaImpuesto / 100;
                    } else {
                        totalDeImpuesto = 0;
                    }

                    //Se calcula importe
                    importe = preciocondescuento * cantidad;

                    // Se establecen los valores al formulario
                    form.setValues({
                        Precio: precio,
                        cantidad: cantidad,
                        moneda: moneda,
                        PorcentajeDescuento: desc + '%',
                        importe: APP.core.FormatCurrency.currency(importe, moneda),
                        precioConDescuento: APP.core.FormatCurrency.currency(preciocondescuento, moneda),
                        CodigoAlmacen: codigoAlmacen
                    });

                    form.getValues();

                    me.actualizaCantidad(null, cantidad, null);

                } else {
                    Ext.Msg.alert('Datos Incorrectos', response.Descripcion, Ext.emptyFn);
                }
            }
        });
    },

    /**
     * Muestra el formulario para editar un producto (agregarproductosform).
     * @param list Ësta lista.
     * @param index El índice del ítem tapeado.
     * @param target El elemento tapeado.
     * @param record El record asociado al ítem.
     */
    editarPartida: function (list, index, target, record) {
        var me = this,
            view = me.getNavigationOrden(),
            form,
            field,
            valuesForm,
            values = record.data,
            id = record.data.id,
            ordenes = Ext.getStore('Ordenes'),
            ind = ordenes.find('id', id),
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada;

        if (view.getActiveItem().xtype == 'agregarproductosform') {
            return
        }

        view.push({
            xtype: 'agregarproductosform',
            modo: 'edicion',
            ind: ind
        });

        form = view.getActiveItem();
        field = form.down('fieldset');

        field.setTitle('Editar producto');
        //field.down('#descripcion').setDisabled(true);
        view.getNavigationBar().down('#agregarProductos').hide();

        if (values.moneda != codigoMonedaSeleccionada) {
            valuesForm = me.ponValoresOriginalesAAgregarProductoForm(values); // Por si la moneda del producto es diferente a la del documento.            
            form.setValues(valuesForm);
            form.setValues({
                importe: valuesForm.importe
            });
        } else {
            form.setValues(values);
        }
        //form.setValues(values);
    },

    /**
    * Establece los valores originales a agregarproductosform, esta funcion se llama cuando la moneda del documento es distinta a la
    * moneda del producto.
    * @param values Los valores a cambiar en el form.
    * @return Un nuevo objeto con los nuevos valores
    */
    ponValoresOriginalesAAgregarProductoForm: function (values) {
        var me = this,
            precio, importe, newObject, totaldeimpuesto, precioConDescuento, descuento,
            moneda = values.moneda,
            tipoCambio = me.getOpcionesOrden().tipoCambio,

            newObject = {
                Precio: values.Precio,
                importe: values.importe,
                totalDeImpuesto: values.totalDeImpuesto,
                CodigoArticulo: values.CodigoArticulo,
                CodigoSocio: values.CodigoSocio,
                Disponible: values.Disponible,
                Imagen: values.Imagen,
                NombreAlmacen: values.NombreAlmacen,
                CodigoAlmacen: values.CodigoAlmacen,
                NombreArticulo: values.NombreArticulo,
                cantidad: values.cantidad,
                PorcentajeDescuento: values.PorcentajeDescuento,
                id: values.id,
                moneda: values.moneda,
                precioConDescuento: values.precioConDescuento
            };
/*            console.log(moneda);
            console.log(me.codigoMonedaPredeterminada);
            console.log(me.codigoMonedaSeleccionada);
            console.log(values.TipoCambio);*/

        if (!values.esOrdenRecuperada) {
            if (moneda != me.codigoMonedaPredeterminada && me.codigoMonedaSeleccionada == me.codigoMonedaPredeterminada) {
                descuento = APP.core.FormatCurrency.formatCurrencytoNumber(values.PorcentajeDescuento);
                precio = APP.core.FormatCurrency.formatCurrencytoNumber(values.Precio);
                precio = precio * 100 / (100 - descuento);
                precio = precio / values.TipoCambio;
                precio = parseFloat(precio.toFixed(2));
                importe = APP.core.FormatCurrency.formatCurrencytoNumber(values.importe) / values.TipoCambio;
                precioConDescuento = APP.core.FormatCurrency.formatCurrencytoNumber(values.precioConDescuento);
                
                newObject.totalDeImpuesto = newObject.totalDeImpuesto / values.TipoCambio;

                //console.log(precio, 'El precio es');
            }            
        } else {            
            console.log(values);
            precio = APP.core.FormatCurrency.formatCurrencytoNumber(values.precioConDescuento);
            precioConDescuento = APP.core.FormatCurrency.formatCurrencytoNumber(values.precioConDescuento);
            importe = precioConDescuento * values.cantidad;//APP.core.FormatCurrency.formatCurrencytoNumber(values.importe);

            console.log(precio);
            console.log(precioConDescuento);
            tipoCambio = APP.core.FormatCurrency.formatCurrencytoNumber(values.Precio) / precioConDescuento;
            //console.log(tipoCambio);
            //newObject.importe = APP.core.FormatCurrency.currency(importe, moneda);
            newObject.precioConDescuento = APP.core.FormatCurrency.currency(precioConDescuento, moneda);
        }

        totalDeImpuesto = values.totalDeImpuesto;
        newObject.importe = APP.core.FormatCurrency.currency(importe, moneda);
        newObject.Precio = APP.core.FormatCurrency.currency(precio, moneda);

        return newObject;
    },

    /**
     * Actualiza el valor del importe al modificarse la cantidad
     * @param numberField Éste NumberField
     * @param newValue El nuevo valor
     * @param oldValue El valor original
     */
    actualizaCantidad: function (numberField, newValue, oldValue) {
        var me = this,
            view = me.getNavigationOrden(),
            valoresForm = view.getActiveItem().getValues(),
            preciocondescuento = APP.core.FormatCurrency.formatCurrencytoNumber(valoresForm.precioConDescuento) * newValue,
            importe = preciocondescuento,
            sujetoImpuesto = me.getOpcionesOrden().sujetoImpuesto,
            totalDeImpuesto = me.getOpcionesOrden().totalDeImpuesto;

        if (sujetoImpuesto) {
            totalDeImpuesto = preciocondescuento * me.tasaImpuesto / 100;            
        }

        view.getActiveItem().setValues({
            importe: APP.core.FormatCurrency.currency(importe, valoresForm.moneda)
        });
    },

    /**
     * Manda un mensaje con el codigo de las direcciones tanto de entrega como fiscal.
     */
    guardaDatosDeCliente: function (button) {
        var me = this,
            direccionEntrega = me.getOpcionesOrden().direccionEntrega,
            direccionFiscal = me.getOpcionesOrden().direccionFiscal;

        me.mandaMensaje('Códigos de dirección', 'Entrega: ' + direccionEntrega + '\nFiscal: ' + direccionFiscal);
    },

    /**
     * Determina la siguiente vista productosorden o partidacontainer dependiendo del ítem activo, si no está en
     * partidacontainer este boton dice "Back".
     * @param button Este botón.
     */
    onAgregarPartida: function (button) {
        var me = this,
            view = me.getMain().getActiveItem(),
            itemActivo = me.getOpcionesOrden().getActiveItem(),
            store = Ext.getStore('Productos');

        if (itemActivo.isXType('partidacontainer')) {

            Ext.getStore('Productos').resetCurrentPage();

            store.setParams({
                CardCode: me.idCliente,
                Criterio: ""
            });

            view.push({
                xtype: 'productosorden'
            });

            store.clearFilter();
            store.load();

            view.getNavigationBar().down('#agregarProductos').hide()
        } else {
            view.getActiveItem().setActiveItem(0);
        }
    },

    /**
     * Le establece la cantidad a cada uno de los elementos del store de productos, esto sucede al refrescar el store
     * pues desde el backend no traen cantidad.
     * @param productos El store de datos.
     * @param data La colección de records.
     */
    estableceCantidadAProductos: function (productos) {
        var ordenes = Ext.getStore('Ordenes'),
            codigo,
            ind,
            cantidadActual,
            cantidad;

        if (ordenes.getCount() > 0) {
            ordenes.each(function (item, index, length) {
                codigo = item.get('CodigoArticulo');
                cantidad = item.get('cantidad');
                ind = productos.find('CodigoArticulo', codigo);
                if (ind != -1) { // Validamos que el elemento de la orden esté en los elementos actuales del store.
                    cantidadActual = productos.getAt(ind).get('cantidad');
                    productos.getAt(ind).set('cantidad', cantidadActual + cantidad);
                }
            });
        }
    },

    /**
     * Al dispararse el evento pop de navigationorden muestra el botón agregarProductos si el ítem activo es
     * clientecontainer o editarpedidoform, esto sucede cuando se selecciona la moneda o la dirección.
     * @param t Éste navigationview.
     * @param v La vista que ha sido popeada.
     */
    onPopNavigationOrden: function (t, v) {
        var me = this,
            view = me.getNavigationOrden(),
            tabPanel = me.getOpcionesOrden(),
            itemActivo = t.getActiveItem().getActiveItem(),
            idCliente = tabPanel.idCliente;

        if (itemActivo.isXType('clientecontainer') || itemActivo.isXType('editarpedidoform')) {
            view.getNavigationBar().down('#agregarProductos').show();
        }

        if (itemActivo.isXType('partidacontainer') && v.isXType('agregarproductosform')) {
            view.getNavigationBar().down('#agregarProductos').show();
        }

        t.getNavigationBar().setTitle(idCliente);
    },

    /**
     * Confirma si se desea terminar la orden de venta.
     */
    confirmaTerminarOrden: function (newActiveItem, t, oldActiveItem, eOpts) {
        var me = this,
            opcionesOrden = me.getOpcionesOrden();

        if (opcionesOrden.actionOrden == 'crear') {
            Ext.Msg.confirm("Terminar orden", "¿Desea terminar la orden de venta?", function (e) {

                if (e == 'yes') {
                    me.onTerminarOrden();
                } else {
                    me.getOpcionesOrden().setActiveItem(0);
                }
            });
        } else {
            Ext.Msg.confirm("Actualizar orden", "¿Desea actualizar la orden de venta?", function (e) {

                if (e == 'yes') {
                    me.onTerminarOrden();
                } else {
                    me.getOpcionesOrden().setActiveItem(0);
                }
            });
        }

    },

    /**
     * Termina la orden del pedido.
     */
    onTerminarOrden: function () {
        var me = this,
            menuNav = getMenuNav();
            total = 0,
            store = Ext.getStore('Ordenes'),
            array = store.getData().items,
            url, msg,
            clienteSeleccionado = me.getOpcionesOrden().clienteSeleccionado,
            idCliente = me.getNavigationOrden().getNavigationBar().getTitle,
            titulo = me.getNavigationOrden().down('toolbar').getTitle(),
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada,
            codigoMonedaPredeterminada = me.getOpcionesOrden().codigoMonedaPredeterminada,
            codigoImpuesto = me.getOpcionesOrden().codigoImpuesto,
            direccionEntrega = me.getOpcionesOrden().direccionEntrega,
            direccionFiscal = me.getOpcionesOrden().direccionFiscal,
            tipoCambio = me.getOpcionesOrden().tipoCambio;

        me.getMainCard().getActiveItem().getMasked().setMessage('Enviando orden...');
        me.getMainCard().getActiveItem().setMasked(true);

        if (array.length > 0) {
            var params = {
                CodigoUsuario: localStorage.getItem("CodigoUsuario"),
                CodigoSociedad: localStorage.getItem("CodigoSociedad"),
                CodigoDispositivo: localStorage.getItem("CodigoDispositivo"),
                Token: localStorage.getItem("Token"),
                "Orden.CodigoSocio": idCliente,
                "Orden.NombreSocio": titulo,
                "Orden.FechaCreacion": Ext.DateExtras.dateFormat(new Date(), 'Y-m-d'),
                "Orden.FechaEntrega": Ext.DateExtras.dateFormat(new Date(), 'Y-m-d'),
                "Orden.CodigoMoneda": codigoMonedaSeleccionada.trim(),
                "Orden.CodigoImpuesto": codigoImpuesto,
                "Orden.RFCSocio": clienteSeleccionado.RFC,
                "Orden.DireccionEntrega": direccionEntrega,
                "Orden.DireccionFiscal": direccionFiscal,                
            };            

            Ext.Array.forEach(array, function (item, index, allItems) {
                var moneda = item.get('moneda'),
                    precio = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('Precio')),
                    precioConDescuento = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('precioConDescuento'));
                    //importe = Imobile.core.FormatCurrency.formatCurrencytoNumber(item.get('precioConDescuento')) * item.get('cantidad');

                if(moneda != codigoMonedaPredeterminada){ // Si la moneda del artículo es diferente a la predeterminada hay que hacer una conversión.
                    precioConDescuento *= tipoCambio;
                    precio /= tipoCambio;
                    precio = parseFloat(precio.toFixed(2));
                    console.log('moneda diferente ' + moneda + 'p ' + codigoMonedaPredeterminada + 'p');
                }

                importe = precioConDescuento * item.get('cantidad');
                total += precioConDescuento * item.get('cantidad') + item.get('totalDeImpuesto');

                params["Orden.Partidas[" + index + "].CodigoArticulo"] = item.get('CodigoArticulo');
                params["Orden.Partidas[" + index + "].Cantidad"] = item.get('cantidad');
                params["Orden.Partidas[" + index + "].Precio"] = precio;//Imobile.core.FormatCurrency.formatCurrencytoNumber(item.get('Precio'));
                params["Orden.Partidas[" + index + "].CodigoAlmacen"] = item.get('CodigoAlmacen');
                params["Orden.Partidas[" + index + "].Linea"] = index;
                params["Orden.Partidas[" + index + "].Moneda"] = moneda.trim();//item.get('moneda').trim();
                params["Orden.Partidas[" + index + "].Importe"] = importe;//Imobile.core.FormatCurrency.formatCurrencytoNumber(item.get('precioConDescuento')) * item.get('cantidad');
                params["Orden.Partidas[" + index + "].PorcentajeDescuento"] = APP.core.FormatCurrency.formatCurrencytoNumber(item.get('PorcentajeDescuento'));
                params["Orden.Partidas[" + index + "].tipoCambio"] = item.get('TipoCambio');
            });

            params["Orden.TotalDocumento"] = parseFloat(total.toFixed(2));

            if (menuNav.actionOrden == 'crear') {
                url = "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_OrdenVenta/AgregarOrdenMobile";
                msg = "Se agrego la orden correctamente con folio: ";
            } else {
                params["Orden.NumeroDocumento"] = me.getOpcionesOrden().NumeroDocumento;
                url = "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_OrdenVenta/ActualizarOrdenVentaiMobile";
                msg = "Se acualizo la orden correctamente con folio: ";
            }

            console.log(params);

            Ext.data.JsonP.request({
                url: url,
                params: params,
                callbackKey: 'callback',
                success: function (response) {                    
                    if (response.Procesada) {
                        me.getMainCard().getActiveItem().setMasked(false);
                        me.getMainCard().setActiveItem(1);
                        Ext.Msg.alert("Orden Procesada", msg + response.CodigoUnicoDocumento);
                        store.clearData();
                        me.getNavigationOrden().remove(me.getNavigationOrden().down('toolbar'), true);
                        me.getMenu().remove(me.getMenu().down('toolbar'), true);
                        me.getMainCard().getActiveItem().pop();
                    } else {
                        me.getMainCard().getActiveItem().setMasked(false);
                        Ext.Msg.alert("Orden No Procesada", "No se proceso la orden correctamente: " + response.Descripcion);
                        me.getOpcionesOrden().setActiveItem(0);
                    }
                }
            });
        } else {
            me.getMainCard().getActiveItem().setMasked(false);
            me.getOpcionesOrden().setActiveItem(0);
            Ext.Msg.alert("Productos", "Selecciona al menos un Producto");
        }
    },

    onSeleccionarTransaccion: function (t, index, target, record, e, eOpts) {
        var me = this,
            view = me.getMenuNav(),
            codigoMonedaSeleccionada = me.getOpcionesOrden().codigoMonedaSeleccionada(),
            codigoMonedaPredeterminada = me.getOpcionesOrden().codigoMonedaPredeterminada(),
            idCliente = me.getMenuNav().getNavigationBar().getTitle(),
            store = Ext.getStore('Ordenes'),
            barraTitulo = ({
            xtype: 'toolbar',
            docked: 'top',
            title: 'titulo'
        });

        me.getMainCard().getAt(2).setMasked(false);

        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_Consultas/RegresarOrdenVentaiMobile",
            params: {
                CodigoUsuario: localStorage.getItem("CodigoUsuario"),
                CodigoSociedad: localStorage.getItem("CodigoSociedad"),
                CodigoDispositivo: localStorage.getItem("CodigoDispositivo"),
                Token: localStorage.getItem("Token"),
                Criterio: record.get('NumeroDocumento')
            },
            callbackKey: 'callback',
            success: function (response) {
                var response = response.Data[0],
                    partidas = response.Partidas;
                
                me.codigoMonedaSeleccionada = response.CodigoMoneda + ' ';
                me.getOpcionesOrden().NumeroDocumento = record.get('NumeroDocumento');
console.log(response);
                if (partidas.length < 2) {
                    me.getPartidaContainer().down('list').emptyTextCmp.show();
                } else {
                    me.getPartidaContainer().down('list').emptyTextCmp.hide();
                }

                partidas.forEach(function (item, index) {
                    console.log(item, 'Item');
                var moneda = item.Moneda + ' ',
                    precio = item.Importe / item.Cantidad,
                    precioConDescuento = item.PrecioDescuento,
                    importe = item.Importe;

/*                    console.log(precio);
                    console.log(precioConDescuento);
                    me.tipoCambio = precio / precioConDescuento;
                    console.log(me.tipoCambio);*/
                    //importe = Imobile.core.FormatCurrency.formatCurrencytoNumber(item.get('precioConDescuento')) * item.get('cantidad');
/*                    console.log(precioConDescuento, "Precio con descuento");
                    if(moneda != me.codigoMonedaSeleccionada){ // Si la moneda del artículo es diferente a la seleccionada hay que hacer una conversión.
                        precioConDescuento *= me.tipoCambio;
                        precio /= me.tipoCambio;
                        console.log('moneda diferente ' + moneda + 'p ' + me.codigoMonedaSeleccionada + 'p');
                    }*/

                    //importe = Imobile.core.FormatCurrency.currency(precioConDescuento * item.Cantidad, me.codigoMonedaSeleccionada) ;//get('cantidad');
                //total += precioConDescuento * item.get('cantidad') + item.get('totalDeImpuesto');

                    partidas[index].cantidad = partidas[index].Cantidad;
                    partidas[index].importe = APP.core.FormatCurrency.currency(importe, codigoMonedaSeleccionada);
                    partidas[index].totalDeImpuesto = partidas[index].TotalImpuesto;
                    partidas[index].Imagen = 'http://' + localStorage.getItem("dirIP") + partidas[index].Imagen;
                    partidas[index].moneda = partidas[index].Moneda + ' ';
                    partidas[index].precioConDescuento = APP.core.FormatCurrency.currency(precioConDescuento, codigoMonedaSeleccionada);
                    partidas[index].Precio = APP.core.FormatCurrency.currency(precio, codigoMonedaSeleccionada);
                    partidas[index].nombreMostrado = Ext.String.ellipsis(partidas[index].NombreArticulo, 25, false);
                    //partidas[index].CodigoAlmacen = partidas[index].CodigoAlmacen;
                    partidas[index].PorcentajeDescuento = partidas[index].PorcentajeDescuento + '%';
                    partidas[index].esOrdenRecuperada = true;

                    console.log(partidas[index]);
                });

                if(me.codigoMonedaSeleccionada != codigoMonedaPredeterminada){
                    var monedas = Ext.getStore('Monedas'),
                        indMoneda = monedas.find('CodigoMoneda', codigoMonedaSeleccionada.trim());
                        console.log(monedas.getAt(indMoneda));

                    me.estableceMonedaPredeterminada(monedas.getAt(indMoneda));
                }
                                
                store.setData(partidas);
                Ext.getStore('Productos').setData(partidas);                
                me.getMainCard().setActiveItem(2); // Activamos el item 2 del menu principal navigationorden
                me.getMainCard().getActiveItem().getNavigationBar().setTitle(idCliente); //Establecemos el title del menu principal como el mismo del menu de opciones
                me.getMainCard().getActiveItem().down('opcionesorden').setActiveItem(0); //Establecemos como activo el item 0 del tabpanel.
                me.actualizarTotales();
                barraTitulo.title = view.down('toolbar').getTitle();
                me.getMainCard().getActiveItem().add(barraTitulo);
            }
        });

    },

    /**
     * Muestra la lista de los almacenes disponibles.
     */
    onListAlmacen: function (t, e, eOpts) {
        var me = this,
            view = me.getMainCard().getActiveItem(),
            value = view.down('agregarproductosform').getValues(),
            almacenes = localStorage.getItem('Almacenes');

        view.push({
            xtype: 'almacenlist',
            codigoArticulo: value.CodigoArticulo
        });

        view.down('almacenlist').setData(almacenes);
    },

    onSeleccionarAlmacen: function (t, index, target, record, e, eOpts) {
        var me = this,
            view = me.getMainCard().getActiveItem(),
            almacenes = localStorage.getItem('Almacenes');

        Ext.Array.forEach(almacenes, function (item, index) {
            item.Predeterminado = false;
        });

        almacenes[index].Predeterminado = true;
        console.log(almacenes[index]);
        //me.CodigoAlmacen = me.almacenes[index].CodigoAlmacen; //record.get('CodigoAlmacen');

        Ext.data.JsonP.request({
            url: "http://" + localStorage.getItem("dirIP") + "/iMobile/COK1_CL_Consultas/ObtenerDisponibleiMobile",
            params: {
                CodigoUsuario: localStorage.getItem('CodigoUsuario'),
                CodigoSociedad: '001',
                CodigoDispositivo: '004',
                ItemCode: t.codigoArticulo,
                Token: localStorage.getItem("Token"),
                Almacen: record.get('CodigoAlmacen')
            },
            callbackKey: 'callback',
            success: function (response) {

                var procesada = response.Procesada,
                valor = {
                    Disponible: 'Disponible', 
                    NombreAlmacen: record.get('NombreAlmacen'),
                    CodigoAlmacen: record.get('CodigoAlmacen')
                };

                if(procesada){
                    valor.Disponible = parseFloat(response.Data[0]).toFixed(2);                    
                } else {
                    valor.Disponible = 'Error al obtener disponible';
                }

                    view.down('agregarproductosform').setValues(valor);
                    view.pop();
            }
        });
    },

    launch: function (){
        var me = this;        
        Ext.getStore('Productos').on('load', me.estableceCantidadAProductos);
    }
});