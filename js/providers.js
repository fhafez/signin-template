"use strict";

var ProviderModel = Backbone.Model.extend({
    urlRoot: "../php/providersJS.php/",
    defaults: {
        description: '',
    },
    validate: function(attrs, options) {
        if (!attrs.description) {
            return "Providers description is required";
        }
    }
});

var ProvidersCollection = Backbone.Collection.extend({
    model: ProviderModel,
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


var ProviderView = Backbone.View.extend({
    tagName: 'tr',
    //model: AppointmentModel,
    template: _.template($('#providers-template').html()),
    
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
        'click #destroy_provider': 'destroy',
        'click #edit_provider' : 'edit',
        'click #save_provider' : 'save',
        'keypress #description' : 'updateOnEnter'
    },
    edit: function(e) {
        console.log('editing provider');
        this.$el.removeClass("view");
        this.$el.addClass("editing");
    },
    save: function(e) {
        console.log('saving provider');
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


var ProvidersAppView = Backbone.View.extend({
    //el: '#appspace',
    template: _.template($('#providersapp-template').html()),
    initialize: function() {
        this.$el.html(this.template());
        //appointmentsCollection.on('add', this.addAppointment, this);
        //servicesCollection.on('reset', this.addAll, this);
        this.listenTo(providersCollection, 'reset', this.addAll);
    },
    render: function() {
        return this;
    },
    events: {
        'click #newprovider': 'addClicked',
    },
    addProvider: function(providerModel) {
        //console.log('in addAppointment() .. appointmentModel says ' + JSON.stringify(appointmentModel.toJSON()));
        var view_provider = new ProviderView({model: providerModel, parent: this});
        $('#providers-table').append(view_provider.render().el);
    },
    addAll: function(){
        //console.log('service: in addall()');
        
        this.$('#providers-table').html($('#providers-header').html()); // clean the appointments table
        //console.log("servicesCollection has " + servicesCollection.length);
        
        providersCollection.each(this.addProvider, this);

    },
    addClicked: function() {
        this.providerModel = new ProviderModel({description: $('#new_provider_description').val() });
        
        if (this.providerModel.isValid()) {
            this.addProvider(this.providerModel);
            this.providerModel.save();
            providersCollection.add(this.providerModel, {wait: true});
        } else {
            errorsdialog.show(this.providerModel.validationError);
        }        
    },
    updateOnEnter: function(e) {
        if (e.which === 13) {
            //console.log('services: enter pressed');
            e.currentTarget.blur();
        }
    },
    closeAll: function() {
        //console.log('closeAll called on servicesappview');
        this.trigger('close:all');
        this.unbind();
        providersCollection.unbind('reset', this.addAll);
        this.remove();

    }
});



//var appointmentsCollection = new AppointmentsCollection([], {date_from: moment().subtract(1,"M").format("YYYY-MM-DD"), date_to: moment().format("YYYY-MM-DD")});
var providersCollection = new ProvidersCollection();

providersCollection.fetch({
    reset: true
});

//console.log($('#date_from').val() + " " + $('#date_to').val());
//console.log("Services.length: " + servicesCollection.length);
