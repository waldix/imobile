Ext.define('Imobile.controller.Main',{
    extend:'Ext.app.Controller',

    config:{
        refs:{
            main:{
                selector:'main'
            },
            menu: 'menu',
            opcionesOrden: 'opcionesorden',
            opcionCliente: 'opcionclientelist',
            seleccionadorProFav: 'seleccionadorprofav',
            direcciones: 'direccionescontainer',
            productosOrden: 'productosorden',
            productosView: 'productosview',
            navigationOrden: 'navigationorden'

        },
        control:{
            'loginform':{
                logged: 'onLoginUser'
            },
            'menu dataview':{
                itemtap: 'onSelectMenu'
            },
            'main navigationview #agregarProductos':{
                tap: 'onAgregarPartida'
            },
            'navigationorden':{
                pop: 'onPopNavigationOrden'
            }
        }
    },

    //onLoginUser:function(form,token){
    onLoginUser:function(){
        this.getMain().setActiveItem(1);
    },

    onSelectMenu: Ext.emptyFn,

    aleatorio: function (inferior,superior){ 
        var numPosibilidades = superior - inferior,
        aleat = Math.random() * numPosibilidades, 
        aleat = Math.floor(aleat);

        return parseInt(inferior) + aleat;
    },

    dameColorAleatorio: function (){ 
        var hexadecimal = new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"),
        color_aleatorio = "#",
        posarray;

        for (i=0;i<6;i++){
            posarray = this.aleatorio(0,hexadecimal.length)
            color_aleatorio += hexadecimal[posarray] 
        } 
        return color_aleatorio 
    },

    launch:function(){
    }
         
});