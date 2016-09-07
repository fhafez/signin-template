var ClientModel = Backbone.Model.extend({
    urlRoot: '../php/clientsJS.php/hello/',
    defaults: {
        firstname: 'firstname',
        lastname: 'lastname',
        address: {street: '', city: '', postalcode: ''},
        username: '',
        password: '',
        birthdate: ''
    },
    /*
    url: function() {
        return 'clientsJS.php/hello/' + this.id;
    },
    */
    initialize: function (options) {
        //this.id = options.id;
        //console.log('model created');
    },
    validate: function(attrs, options) {
        //console.log('in validate');
        //console.log(attrs);
        if (!attrs.dob || !attrs.lastname || !attrs.firstname) {
            return "Firstname, Lastname and DoB are all required fields";
        }
        if (!moment(attrs.dob, 'YYYY-MM-DD', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
    },
    /*
    sync: function() {
        //console.log('client model sync called');
    }
    */
    
});

var ClientServiceModel = Backbone.Model.extend({
    
    // this model is a single service
    urlRoot: '../php/servicesJS.php/',
    defaults: {
        
    }
});

var ClientProviderModel = Backbone.Model.extend({
    
    // this model is a single provider
    urlRoot: '../php/providersJS.php/',
    defaults: {
        
    }
});

var AvailableServiceModel = Backbone.Model.extend({
    
    // this model is an available service for a client
    urlRoot: '../php/servicesJS.php/clientservice',
    defaults: {}
});

var ClientsCollection = Backbone.Collection.extend({
    model: ClientModel,
    url: '../php/clientsJS.php/',
    initialize: function(options) {
        if (options && options.url)
            this.url = options.url;
        //console.log('CC created!');
    },
    parse: function(response) {
        this.page = response.page;
        this.per_page = response.per_page;
        this.total_pages = response.total_pages;
        return response.clientlist;
    },
    searchByName: function(firstname, lastname) {
        return this.where({firstname: firstname});
        //return this;
    },
    sync: function(method, collection, options) {
        //console.log('client collection sync called with ' + method);
        //console.log('client collection sync called on collection ' + JSON.stringify(collection.toJSON()));
        //console.log('client collection sync called with options ' + options);
        return Backbone.sync(method, collection, options);
    }
});

// a collection of all services available
var AllServicesCollection = Backbone.Collection.extend({
    model: ClientServiceModel,
    wait: true,
    url: "../php/servicesJS.php/",
    initialize: function(models, options) {
    },
    syncComplete: function() {
        //console.log('services sync completed!');
    },
    comparator: function(appointment) {
    },
});

// a collection of all providers available
var AllProvidersCollection = Backbone.Collection.extend({
    model: ClientServiceModel,
    wait: true,
    url: "../php/providersJS.php/",
    initialize: function(models, options) {
    },
    syncComplete: function() {
        //console.log('services sync completed!');
    },
    comparator: function(appointment) {
    },
});

// a collection of services that a client has available to them
var ClientServicesCollection = Backbone.Collection.extend({
    
    // this collection is all services for a single client
    model:ClientServiceModel,
    url: '../php/servicesJS.php/remaining/',
    initialize: function(options) {
        
       //console.log('init ClientServicesCollection');
       //console.log(options);
        
    }
});

// one option in the drop down menu of all services
var OneServiceView = Backbone.View.extend({

    tagName: 'option',
            
    initialize: function(options) {

        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        
       //console.log('init OneServiceView');
        _.bindAll(this, 'render');
                
    },
    
    render: function() {
        
       //console.log('render OneServiceView');

        $(this.el).attr('value', this.model.get('id')).html(this.model.get('description'));
        
       //console.log('rendering ' + this.model.get('id') + ' ' + this.model.get('description'));
        
        return this;
        
    },
    
    quit: function() {
        
       //console.log('quitting oneserviceview');
        
    }
    
});

// a drop down menu of all services
var AllServicesView = Backbone.View.extend({
       
    initialize: function(options) {

        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        
        _.bindAll(this, 'addService', 'addAllServices');
        this.collection.bind('reset', this.addAllServices);
        
       //console.log(this.collection);
       //console.log(this.el);
        
        this.$el.html('');
    },
    
    //serviceViews: [],
        
    addService: function(service) {
       //console.log('adding ' + JSON.stringify(service.toJSON()));
        
        var serviceView = new OneServiceView({model: service, parent:this});
        this.serviceViews.push(serviceView);
       //console.log(this);
       //console.log(this.serviceViews);

        $(this.el).append(serviceView.render().el);
    },
    
    addAllServices: function() {
       //console.log('adding all services');
        
       //console.log(this.serviceViews);
        _.each(this.serviceViews, function(serviceView) {
            //console.log(serviceView);
            serviceView.remove(); 
        });
        this.serviceViews = [];
        this.collection.each(this.addService);
    },
    
    quit: function() {
        
       //console.log('closing allservicesview');
        this.trigger('close:all');
        this.collection.unbind('reset', this.addAllServices);
        this.unbind();
        this.serviceViews = null;
        this.stopListening();
        this.collection.remove();
        this.remove();

    }
    /*
    render: function() {
        
        allServicesCollection.each(console.log('blah'), this);
        
    }
    */
    
});

// a drop down menu of all providers
var AllProvidersView = Backbone.View.extend({
       
    initialize: function(options) {

        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        
        _.bindAll(this, 'addProvider', 'addAllProviders');
        this.collection.bind('reset', this.addAllProviders);
        
       //console.log(this.collection);
       //console.log(this.el);
        
        this.$el.html('');
    },
            
    addProvider: function(provider) {
       //console.log('adding ' + JSON.stringify(provider.toJSON()));
        
        var providerView = new OneServiceView({model: provider, parent:this});
        this.providerViews.push(providerView);
       //console.log(this);
       //console.log(this.providerView);

        $(this.el).append(providerView.render().el);
    },
    
    addAllProviders: function() {
       //console.log('adding all providers');
        
       //console.log(this.providerViews);
        _.each(this.providerViews, function(providerView) { 
            //console.log(providerView); 
            providerView.remove(); 
        });
        this.providerViews = [];
        this.collection.each(this.addProvider);
    },
    
    quit: function() {
        
       //console.log('closing allprovidersview');
        this.trigger('close:all');
        this.collection.unbind('reset', this.addAllProviders);
        this.providerViews = null;
        this.unbind();
        this.stopListening();
        this.collection.remove();
        this.remove();
        
    }
});

// a single service view row
var ClientServiceView = Backbone.View.extend({
    tagName: 'div',
    
    id: 'one-client-service',
        
    model: AvailableServiceModel,
    
    template: _.template($('#client-service-template').html()),
    
    initialize: function(options) {
        //this.id = 'client-service' + this.model.id;
        //this.listenTo(this.model, 'destroy', this.remove);
        
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        

    },
    
    events: {
//        "keypress": "updateOnEnter",
        'click #editservicedetails': 'edit',
        'click #saveservicedetails': 'save',
        'click #deleteservicedetails': 'deleteService'
    },
    
    render: function() {
       //console.log(this.model.toJSON());
        
        this.$el.html(this.template(this.model.toJSON()));
        //console.log(this.model.toJSON());
        return this;
    },
  /*  
    updateOnEnter: function(e) {
        //console.log('key pressed ' + e.which);
        if (e.which === 13) {
            //console.log(this.isValid());
            if (this.isValid()) {
                this.save();   
            }
        }
    },
    */
    edit: function() {
       //console.log('clicked edit');
        this.$el.addClass('editing');
    },
    
    save: function() {
       //console.log('clicked save');

       this.model.urlRoot="../php/servicesJS.php/clientservice";

       this.model.set({remaining_appts: this.$('#remaining_appts').val(), mva: this.$('#mva').val()});
       if (this.model.isValid) {
            this.model.save();
       }
       this.$el.removeClass('editing');
    },
    
    deleteService: function() {

        //console.log(this.model.urlRoot);
        if (confirm('are you sure you want to delete ' + this.model.get('provider_name') + ': ' + this.model.get('service_name'))) {
            this.model.urlRoot='../php/servicesJS.php/clientservice';
            this.model.destroy();
            this.model = null;
            
            
            this.stopListening();
            this.trigger('close');
            
            this.$el.empty();
            this.remove();
            this.unbind();
            this.model = null;
            //this.remove();

            // RELEASE THIS OBJECT ENTIRELY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            
        }
    },
    
    quit: function() {
       //console.log('quitting clientserviceview');
        this.trigger('close:all');
        this.unbind();
        this.model.unbind('destroy', this.remove);
        this.model = null;
        this.stopListening();
        this.remove();
    }
    
});

// the services area, one per client
var ClientServicesView = Backbone.View.extend({
    tagName: 'div',
    
    id: 'client-service-template',
    
    //collection: ClientServicesCollection,
    
    initialize: function(options) {
        
        var self = this;
        
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        
        //this.$el.html(this.template());
        
        // if the details are not hidden then hide them
        if ($('#client-details' + self.model.id).hasClass('client-details')) {
            
            $('#client-details' + self.model.id).removeClass('client-details');                        
            $('#client-details' + self.model.id).addClass('client-details-hide');
            
            // make the services div invisible
            $('#new-client-services' + self.model.id).removeClass('client-details');
            $('#new-client-services' + self.model.id).addClass('client-details-hide');

            // make the services div invisible
            $('#add-new-client-services' + self.model.id).removeClass('client-details');
            $('#add-new-client-services' + self.model.id).addClass('client-details-hide');
            
        } else {
   
           //console.log("getting client details...");

            // fetch this client's services
            //var clientServicesCollection = new ClientServicesCollection({ id: this.model.id });
            self.collection = new ClientServicesCollection({ id: this.model.id });
            //clientServicesCollection.fetch({
            self.collection.fetch({
                reset: true,
                data: { 
                    id: this.model.id
                },
                success: function() {

                   //console.log('fetched successfully');
                   //console.log(self.model);

                    if (self.collection.length === 0) {
                        
                        $('#client-details' + self.model.id).html('no services');

                    } else {
                        
                        // print the service details header
                        $('#client-details' + self.model.id).html("<div>\
                            <div class='client-service-data-header' style='width:50px'>&nbsp;</div>\
                            <div class='client-service-data-header' style='width:150px'>Provider</div>\
                            <div class='client-service-data-header' style='width:250px'>Service</div>\
                            <div class='client-service-data-header' style='width:150px'>Active On</div>\
                            <div class='client-service-data-header' style='width:100px'>MVA</div>\
                            <div class='client-service-data-header' style='width:50px'>&nbsp;</div>\
                            </div>");
                        
                        // render the services
                        self.collection.each(self.addService, self);
                        
                    }

                    // make the services div visible
                    $('#client-details' + self.model.id).removeClass('client-details-hide');
                    $('#client-details' + self.model.id).addClass('client-details');

                }
            });
            
            // populate the drop down menus with all the services and providers (for adding new services/providers)
            self.allServicesCollection = new AllServicesCollection({});
            self.allProvidersCollection = new AllProvidersCollection({});
            self.allServicesView = new AllServicesView({el: $('#new-client-services' + self.model.id), collection: self.allServicesCollection, parent:this});
            self.allProvidersView = new AllProvidersView({el: $('#new-client-providers' + self.model.id), collection: self.allProvidersCollection, parent:this});

            // fetch all the services available
            self.allServicesCollection.fetch({
                reset: true,
                success: function() {

                }
            });
            
            // fetch all the providers available
            self.allProvidersCollection.fetch({
                reset: true,
                success: function() {

                    // make the services div visible
                    $('#new-client-services' + self.model.id).removeClass('client-details-hide');
                    $('#new-client-services' + self.model.id).addClass('client-details');

                    // make the providers div visible
                    $('#new-client-providers' + self.model.id).removeClass('client-details-hide');
                    $('#new-client-providers' + self.model.id).addClass('client-details');

                    // make the services div visible
                    $('#add-new-client-services' + self.model.id).removeClass('client-details-hide');
                    $('#add-new-client-services' + self.model.id).addClass('client-details');
                }
            });
        }
    },
    
    allServicesCollection: {},
    allProvidersCollection: {},
    allServicesView: {},
    allProvidersView: {},
    
    addService: function(clientServiceModel) {
        
        clientServiceView = new ClientServiceView({model: clientServiceModel, parent:this});

        //$('#client-details' + this.model.id).html(clientServiceView.render().el);
        $('#client-details' + this.model.id).append(clientServiceView.render().el);
        
        //console.log(clientServiceView.render().el);
        
    },
    
    events: {
        "keypress": "updateOnEnter",
    },
    
    render: function() {
        
        if ($('#client-details' + this.model.id).hasClass('client-details')) {
            
            $('#client-details' + this.model.id).removeClass('client-details');                        
            $('#client-details' + this.model.id).addClass('client-details-hide');
            
            // make the services div invisible
            $('#new-client-services' + this.model.id).removeClass('client-details');
            $('#new-client-services' + this.model.id).addClass('client-details-hide');

            // make the services div invisible
            $('#add-new-client-services' + this.model.id).removeClass('client-details');
            $('#add-new-client-services' + this.model.id).addClass('client-details-hide');
        } else {
            
            $('#client-details' + this.model.id).removeClass('client-details-hide');
            $('#client-details' + this.model.id).addClass('client-details');
            
            // make the services div invisible
            $('#new-client-services' + this.model.id).removeClass('client-details-hide');
            $('#new-client-services' + this.model.id).addClass('client-details');

            // make the services div invisible
            $('#add-new-client-services' + this.model.id).removeClass('client-details-hide');
            $('#add-new-client-services' + this.model.id).addClass('client-details');
            
        }

        return this;
    },
    
    updateOnEnter: function(e) {
        //console.log('key pressed ' + e.which);
        if (e.which === 13) {
            //console.log(this.isValid());
            if (this.isValid()) {
                this.save();   
            }
        }
    },
    
    quit: function() {
       //console.log('quitting clientservicesview');
        this.trigger('close:all');
        this.allServicesCollection.remove();
        this.allProvidersCollection.remove();
        this.allServicesView.remove();
        this.allProvidersView.remove();
        this.collection.remove();
        this.model = null;

        //console.log(this);
        this.unbind();
        this.remove();
    }
    
});



// a view per client - contains a div for the list of services for the client
var ClientView = Backbone.View.extend({
    tagName: 'div',
    
    className: 'inner-clients-content',
    
    template: _.template($('#clients-template').html()),
    
    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'destroy', this.remove);
                
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        
    },
    render: function () {
        
        //console.log('render client view');
        this.$el.html(this.template(this.model.toJSON()));
                
        //this.input = this.$('.edit');
        this.input_firstname = this.$('#firstname');
        this.input_lastname = this.$('#lastname');
        this.input_dob = this.$('#dob');
        
        return this;
    },
    events: {
        // put the events in here
        'dblclick label': 'edit',
        'click label.clickable': 'details',
        'keypress .edit': 'updateOnEnter',
        'blur .edit': 'close',
        'click #destroy': 'destroy',
        'click #edit_link': 'edit',
        'click #done_link': 'close',
        'click #addclientservice': 'addnewservice',
        //'click #deleteservicedetails': 'deleteservicedetails'
    },
    edit: function () {
        this.$el.addClass('editing');
        //this.$el.input.focus();
    },
    addnewservice: function() {
       //console.log('add new service clicked! ' + this.model.id);
        
        service_id = $('#new-client-services' + this.model.id + ' option:selected').val();
        provider_id = $('#new-client-providers' + this.model.id + ' option:selected').val();
        remaining_appts = $('#remaining_appts' + this.model.id).val();
        active_on = $('#active_on' + this.model.id).val();
        mva = $('#mva' + this.model.id + ' option:selected').val();
        
        var self = this;
        
        this.availableServiceModel = new AvailableServiceModel({client_id: this.model.id,service_id: service_id,plan_id: provider_id, active_on: active_on, remaining_appts: remaining_appts, mva: mva});
        this.availableServiceModel.save({}, {
            success: function(m, response) {
                
                //console.log(m.urlRoot);
                //clientServicesView.collection.add(m);
                self.clientServicesView.addService(m);                
                
            },
            error: function(model, response) {
                
                errorsdialog.show('issue connecting to database ' + response.responseText, true);

            }
        });
        //console.log(availableServiceModel);
    },
    
    clientServicesView: null,
    
    availableServiceModel: null,
    
    details: function() {
        
        /*
        detailedClientView = new DetailedClientView({el: "#clientdetails", model: this.model});
        detailedClientView.render();
        */
        
        //console.log(this.clientServicesView);
        
        // TODO: fix the model being passed in to reflect a ClientServiceModel
        /*
       //console.log("getting client details...");
        
        clientServicesCollection = new ClientServicesCollection({ id: this.model.id });
        clientServicesCollection.fetch({
            reset: true,
            data: { 
                id: this.model.id
            }            
        });
        */
        if (!this.clientServicesView) {
            this.clientServicesView = new ClientServicesView({el: "#client-details", model: this.model, parent: this});
        } 
        
        this.clientServicesView.render();
        //$('#service_details').show();
        
    },
    close: function (e) {
        
        firstname_val = this.input_firstname.val().trim();
        lastname_val = this.input_lastname.val().trim();
        dob_val = this.input_dob.val().trim();

        // check that all values have been provided
        if (firstname_val.length && lastname_val.length && dob_val.length) {
            this.model.set({firstname: firstname_val, lastname: lastname_val, dob: dob_val});
            if (this.model.isValid()) {
                this.model.save();
                this.$el.removeClass('editing');
            } else {
                errorsdialog.show(this.model.validationError);
            }
        }
    },
    cancelChange: function() {
        //console.log('canceling request for change');
        this.render();
        this.$el.removeClass('editing');
    },
    updateOnEnter: function(e) {
        if (e.which === 13) {
            this.close();
        } else if (e.which === 0) {
            this.cancelChange();
        }
    },
    destroy: function() {
        //console.log(this.model);
        if (confirm('are you sure you want to delete ' + this.model.get('firstname'))) {
            this.model.destroy();
        }
    },
    quit: function() {
       //console.log('quitting clientview');
        this.trigger('close:all');
        this.unbind();
        this.availableServiceModel = null;
        this.model.unbind('change', this.render);
        this.model.unbind('destroy', this.remove);
        this.remove();
    }
});

var ClientsAppView = Backbone.View.extend({
    el: '#appspace',
    template: _.template($('#clientsapp-template').html()),
    initialize: function(options) {
        
        console.log('init in clientsappview');
        clientsCollection = new ClientsCollection();
        displayedClients = [];
        
        /*
        clientsCollection.on('fetch', function() { 
            console.log('loading clients...');
            this.$el.html("loading...");
        }, this);
        */
        
        if (options.page === undefined) {
            this.page = 1;
        } else {
            this.page = options.page;
        }
        
        //clientsCollection.fetch();

        this.$el.html(this.template());
        this.listenTo(clientsCollection, 'add', this.addClient);
        this.listenTo(clientsCollection, 'reset', this.addAll);
        
        clientsCollection.fetch({data: {page: this.page, per_page: 25}, reset:true});

    },
    render: function() {
       console.log('clientsappview render() called');
        return this;
    },
    events: {
        'click #newclient': 'addClicked',
        'click .prevpage': 'backpage',
        'click .nextpage': 'nextpage',
        'click #client_name_search': 'search',
        'click #cancel_name_search': 'cancelSearch'
    },
    backpage: function() {
       //console.log('backpage');
       //console.log(clientsCollection);
        var self = this;
        
        if (this.page > 1) {
            this.page--;
            clientsCollection.fetch({data: {page: this.page, per_page: 25}, 
                                     reset: true,
                                    success: function() {
               //console.log('got the clients for page ' + clientsCollection.page);
                self.page = clientsCollection.page;
                router.navigate('clients/p' + self.page, {trigger: false});            
            }});

        }
        
    },
    nextpage: function() {
       //console.log('nextpage');
        this.page++;
        var self = this;
        clientsCollection.fetch({data: {page: this.page, per_page: 25}, 
                                 reset: true,
                                 success: function() {
           //console.log('got the clients for page ' + clientsCollection.page);
            self.page = clientsCollection.page;
            router.navigate('clients/p' + self.page, {trigger: false});
        }});
        
    },
    search: function() {
        /*
        if ($('#firstname_lookup').val().length > 0 || $('#lastname_lookup').val().length > 0) {
            var matching_clients = clientsCollection.searchByName($('#firstname_lookup').val(),$('#lastname_lookup').val());
            this.$('#clients-list').html(_.template($('#clients-header').html())({thispage: clientsCollection.page, totalpages: clientsCollection.total_pages})); // clean the clients table
            matching_clients.forEach(this.addClient, this);
        }
        //    .each(this.addClient, this);
        */
        if ($('#firstname_lookup').val().length > 0 || $('#lastname_lookup').val().length > 0) {
            clientsCollection.url = '../php/clientsJS.php/search/';
            clientsCollection.fetch({data: {firstname: $('#firstname_lookup').val(), lastname: $('#lastname_lookup').val()}, 
                                     reset: true,
                                     success: function() {
               //console.log('got the clients for page ' + clientsCollection.page);
                router.navigate('clients/search/');
            }});
        }
        
    },
    cancelSearch: function() {
        console.log('canceling');
        clientsCollection.url = '../php/clientsJS.php/';
        router.navigate('clients/p' + this.page, {trigger: true});
        //this.addAll();
    },
    addClient: function(clientModel){
        //console.log('in addClient() .. clientModel says ' + JSON.stringify(clientModel.toJSON()));
        var view = new ClientView({model: clientModel, parent: this});
        displayedClients.push(view);
        $('#clients-list').append(view.render().el);
        
        //var clientServicesListView = new ClientServicesListView({model: clientModel, parent:this});
        //$('#clients-list').append(clientServicesListView.render().el);

    },
    addAll: function(){
       //console.log('in addall() ' + clientsCollection.length);

        var prevpageclasses = 'prevpage';
        var nextpageclasses = 'nextpage';
        
        console.log('adding all.. page is ' + this.page)
        if (this.page == 1) {
            prevpageclasses = 'firstpage';
        } else if (this.page == clientsCollection.total_pages) {
            nextpageclasses = 'lastpage';
        }
        
        
        this.removeAll();
        this.$('#clients-list').html(_.template($('#clients-header').html())({thispage: clientsCollection.page, totalpages: clientsCollection.total_pages, prevpageclasses: prevpageclasses, nextpageclasses: nextpageclasses})); // clean the clients table
        clientsCollection.each(this.addClient, this);
        this.$('#clients-list').append(_.template($('#clients-footer').html())({thispage: clientsCollection.page, totalpages: clientsCollection.total_pages, prevpageclasses: prevpageclasses, nextpageclasses: nextpageclasses})); // clean the clients table

       //console.log('finished addall()');
    },
    removeAll: function() {
        this.$('#clients-list').html('');
        
        /*
        while (displayedClients.length > 0) {
            var d = displayedClients.pop();
            clientsCollection.remove(d.model);
            d.remove();
            console.log('removed one');
           //console.log(displayedClients.pop().render().el);
        }
        */
        
    },
    addClicked: function() {

        //console.log('addClicked ' + this.cid);
        
        this.input_firstname = this.$('#new_firstname');
        this.input_lastname = this.$('#new_lastname');
        this.input_dob = this.$('#new_dob');

        if (!this.input_firstname.val().trim() || !this.input_lastname.val().trim() || !this.input_dob.val().trim()) {
            errorsdialog.show('firstname, lastname and date of birth are all mandatory');
            return;
        }
        
        // store values in global variables
        firstname_val = this.input_firstname.val().trim();
        lastname_val = this.input_lastname.val().trim();
        dob_val = this.input_dob.val().trim();

        var client = new ClientModel();
        client.set('firstname', firstname_val);
        client.set('lastname', lastname_val);
        client.set('dob', dob_val);
        
        var self = this;
        
        if (client.isValid()) {
            client.save({}, {
                success: function() {
                    
                    // create a model inside clientsCollection
                    clientsCollection.add(client, {wait: true});

                    self.input_firstname.val(''); // clean input box
                    self.input_lastname.val(''); // clean input box
                    self.input_dob.val(''); // clean input box
                    
                },
                
                error: function(e) {
                    errorsdialog.show(e);   
                }
            });

        } else {
            errorsdialog.show(client.validationError);   
        }
        //clientsCollection.create(this.newValues(), {wait: true});
        
        //clientsCollection.reset();
        
    },
    newValues: function() {
        return {
            firstname: this.input_firstname.val().trim(),
            lastname: this.input_lastname.val().trim(),
            dob: this.input_dob.val().trim()
        }
    },
    closeAll: function() {
        //$('#service_details').hide();
       //console.log('Closing clientsappview');
        
        // triggering close:all will alert the children ClientViews to close as well
        this.trigger('close:all');
        clientsCollection.unbind('add', this.addClient);
        clientsCollection.unbind('reset', this.addAll);
        this.stopListening();
        this.remove();
    }
});

/*
_.each(["Model", "Collection"], function(name) {
  // Cache Backbone constructor.
  var ctor = Backbone[name];
  // Cache original fetch.
  var fetch = ctor.prototype.fetch;

  // Override the fetch method to emit a fetch event.
  ctor.prototype.fetch = function() {
    // Trigger the fetch event on the instance.
    this.trigger("fetch", this);

    // Pass through to original fetch.
    return fetch.apply(this, arguments);
  };
});
//$.expr.cacheLength = 1;
*/

/*
Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
  if (this.onClose){
   this.onClose();
  }
}
*/
//clientsCollection = new ClientsCollection();
//var clientModel = new ClientModel();
//clientModel.fetch();
//clientsCollection.fetch();

//var detailedClientView = new DetailedClientView();

//var appointmentModel = new AppointmentModel();
//appointmentsCollection = new AppointmentsCollection([], {date_from: $('#date_from').val(), date_to: $('#date_to').val()});
//appointmentsCollection.fetch({reset: true});

//console.log($('#date_from').val() + " " + $('#date_to').val());
//console.log("appointmentsCollection.length: " + appointmentsCollection.length);


//var clientListView = new ClientListView();
