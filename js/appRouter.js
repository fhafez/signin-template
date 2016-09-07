"use strict";

var AppRoutes = Backbone.Router.extend({

    initialize: function(options) {
        this.options = options;
        
//        this.appointments();
        
    },
    routes: {
        "": "appointments",
        "clients(/p:page)(/s:fn)": "clientspage",
        //"clients": "clients",
        "appointments": "appointments",
        "services": "services",
        "providers": "providers",
        "calendar": "calendar"
    },
    loadView: function(view) {
       //console.log('loading view');
       //console.log(view);
        //this.view && this.view.remove();
        //this.view = null;
        //$('#signinmanagementapp').append("<div id='appspace' class='clientsapp' align='center'></div>");
        this.view = view;
        $('#signinmanagementapp').html(this.view.render().el);
        
        //this.view.render();

    },
    clientspage: function(page) {
       //console.log("in clientspage " + page);
        clientsappview = new ClientsAppView({el: "#appspace", page: page});
        
        //this.clientsview = null;
        //this.clientsview = new ClientsAppView({el: "#appspace", page: page});
        
       //console.log(this.clientsview);
        
        //this.loadView(this.clientsview);
        clientsappview.trigger('reset');
        clientsappview.addAll();
        clientsappview.render();
    },
    /*
    clients: function() {
        clientsappview = new ClientsAppView({el: "#appspace"});
        clientsappview.trigger('reset');
        clientsappview.addAll();
        clientsappview.render();
        
    },
    */
    appointments: function() {
        
        //appointmentsappview = new AppointmentsAppView({el: "#appspace", model: appointmentsCollection});
        appointmentsappview = AppointmentsApp({el: "#appspace"});
        //appointmentsappview.dayClicked();
        //appointmentsappview.render();
        
       //console.log('appointments');
        //this.loadView(new AppointmentsAppView({el: "#appspace", model: appointmentsCollection}));
    },
    services: function() {
    
        servicesappview = new ServicesAppView({el: "#appspace", model: servicesCollection });
        servicesappview.addAll();
        servicesappview.render();
        
        //this.loadView(new ServicesAppView({el: "#appspace", model: servicesCollection}));
    },
    providers: function() {

        providersappview = new ProvidersAppView({el: "#appspace", model: providersCollection });
        providersappview.addAll();
        providersappview.render();
        
    },
    calendar: function() {
        
        $('#appspace').append('<div id="calendar"></div>')
        calappview = new CalAppView({el: "#calendar"});        
        calappview.render();
    }
});


var Menu = Backbone.View.extend({
    tagName: "div",

    initialize: function(options) {
        //console.log('init Menu');
        this.options = options;
        router.navigate("appointments", {trigger: true});
        var currentView = undefined;
        
    },
    events: {
        "click": "onClick",
    },
    onClick: function(e) {
        
        var $target = $(e.target);
        var durl = $target.attr("data-url");
        
        //this.currentView = $target.attr("data-url");
       //console.log(durl);
       //console.log('menu item clicked ' + durl);
       //console.log(this.currentView);
        //router.navigate(target.attr("data-url"), {trigger: true});

        
        if (durl && this.currentView !== durl) {

            if ((durl ==='calendar') || durl.startsWith('clients') || (durl === 'appointments') || (durl === 'services') || (durl === 'providers')) {
                
               //console.log('here');
                if (clientsappview) {
                    clientsappview.closeAll();
                    clientsappview = null;
                    $('#signinmanagementapp').append("<div id='appspace' class='clientsapp' align='center'></div>");
                }
                if (appointmentsappview) {
                    //console.log('closing appointments');
                    appointmentsappview.closeAll();
                    appointmentsappview = null;
                    $('#signinmanagementapp').append("<div id='appspace' class='clientsapp' align='center'></div>");
                }
                if (servicesappview) {
                    //console.log('closing services');
                    servicesappview.closeAll();
                    servicesappview = null;
                    $('#signinmanagementapp').append("<div id='appspace' class='clientsapp' align='center'></div>");
                }
                if (providersappview) {
                    //console.log('closing services');
                    providersappview.closeAll();
                    providersappview = null;
                    $('#signinmanagementapp').append("<div id='appspace' class='clientsapp' align='center'></div>");
                }

                this.currentView = durl;
               //console.log('navigating');
                router.navigate($target.attr("data-url"), {trigger: true});
                
            } else {
               //console.log('staying put');
                this.currentView = durl;
            }
            
        }
        
    }
});

var clientsappview = undefined;

var appointmentsappview = undefined;

var servicesappview = undefined;

var providersappview = undefined;


Backbone.history.start();

var router = new AppRoutes();
var menu = new Menu({el: "#menu"});
router.appointments();