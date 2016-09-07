"use strict";

var ServiceModel = Backbone.Model.extend({
    urlRoot: "../php/servicesJS.php/",
    defaults: {
        description: '',
    },
    validate: function(attrs, options) {
        if (!attrs.description) {
            return "Service description is required";
        }
    }
});

var ServiceRemainingModel = Backbone.Model.extend({
    urlRoot: "../php/servicesJS.php/remaining/",
    
    validate: function(attrs, options) {
        if (!attrs.id || !attrs.description) {
            return "Service ID or Description missing";
        }
    }
});

var ServicesRemainingCollection = Backbone.Collection.extend({
    urlRoot: "../php/servicesJS.php/remaining/",
    
    validate: function() {
        
    }
});

var ServiceView = Backbone.View.extend({
    tagName: 'tr',
    //model: AppointmentModel,
    template: _.template($('#services-template').html()),
    
    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'destroy', this.remove);
        
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
        //this.model.on('change', this.render, this);
        //this.model.on('destroy', this.remove, this);
    },
    render: function() {
        //console.log('rendering AppointmentView');
        this.$el.html(this.template(this.model.toJSON()));
        
        return this;
    },
    events: {
        'click #destroy_service': 'destroy',
        'click #edit_service' : 'edit',
        'click #save_service' : 'save',
        'keypress #description' : 'updateOnEnter'
    },
    edit: function(e) {
        console.log('editing service');
        this.$el.removeClass("view");
        this.$el.addClass("editing");
    },
    save: function(e) {
        console.log('saving service');
        console.log(this.$("#description").val());

        this.model.set({description: this.$("#description").val()});
        if (this.model.isValid) {
            this.model.save();
        }

        this.$el.removeClass("editing");
        this.$el.addClass("view");
    },
    updateOnEnter: function(e) {
        if (e.which === 13) {
            //console.log('services: enter pressed');
            this.save(e);
        }
    },    
    destroy: function() {
      //console.log(this.model);
      if (confirm("Are you sure you want to delete " + this.model.attributes.description + "?")) {
        this.model.destroy();
        //appointmentsCollection.fetch({wait: true});
      }
    },
    quit: function() {
        this.unbind();
        this.model.unbind('change', this.render);
        this.model.unbind('destroy', this.remove);
        this.remove();
    }
});

var ServicesRemainingView = Backbone.View.extend({   
   
    template: _.template($('#servicesremaining-template').html()),

    initialize: function(options) {
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
    },
    
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        
        return this;        
    },
    
    quit: function() {
        this.unbind();
        this.remove();
    }

});

var ServicesCollection = Backbone.Collection.extend({
    model: ServiceModel,
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

var ServicesAppView = Backbone.View.extend({
    //el: '#appspace',
    template: _.template($('#servicesapp-template').html()),
    initialize: function() {
        this.$el.html(this.template());
        //appointmentsCollection.on('add', this.addAppointment, this);
        //servicesCollection.on('reset', this.addAll, this);
        this.listenTo(servicesCollection, 'reset', this.addAll);
    },
    render: function() {
        return this;
    },
    events: {
        'click #newservice': 'addClicked',
    },
    addService: function(serviceModel) {
        //console.log('in addAppointment() .. appointmentModel says ' + JSON.stringify(appointmentModel.toJSON()));
        var view_service = new ServiceView({model: serviceModel, parent: this});
        $('#services-table').append(view_service.render().el);
    },
    addAll: function(){
        //console.log('service: in addall()');
        
        this.$('#services-table').html($('#services-header').html()); // clean the appointments table
        //console.log("servicesCollection has " + servicesCollection.length);
        
        servicesCollection.each(this.addService, this);

    },
    addClicked: function() {
        this.serviceModel = new ServiceModel({description: $('#new_service_description').val() });
        
        if (this.serviceModel.isValid()) {
            this.addService(this.serviceModel);
            this.serviceModel.save();
            servicesCollection.add(this.serviceModel, {wait: true});
        } else {
            errorsdialog.show(this.serviceModel.validationError);
        }        
    },
    updateOnEnter: function(e) {
        if (e.which === 13) {
            //console.log('services: enter pressed');
            e.currentTarget.blur();
        }
    },
    sortAppointments: function(e) {
        if (e.currentTarget.id === 'description') {
            servicesCollection.comparator = function(service) {
                return [ service.get('description')];
            }
        }
        servicesCollection.sort();
    },
    closeAll: function() {
        //console.log('closeAll called on servicesappview');
        this.trigger('close:all');
        this.unbind();
        servicesCollection.unbind('reset', this.addAll);
        this.remove();

    }
});



//var appointmentsCollection = new AppointmentsCollection([], {date_from: moment().subtract(1,"M").format("YYYY-MM-DD"), date_to: moment().format("YYYY-MM-DD")});
var servicesCollection = new ServicesCollection();

servicesCollection.fetch({
    reset: true
});

//console.log($('#date_from').val() + " " + $('#date_to').val());
//console.log("Services.length: " + servicesCollection.length);
