"use strict";

var SigninModel = Backbone.Model.extend({
    urlRoot: 'php/signinJS.php/',
    defaults: {
        firstname: '',
        lastname: '',
        birthdate: '',
        sig: '',
        signed_in: false,
        services: []
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
        
        // both first and last name are required
        if (!attrs.lastname || !attrs.firstname) {
            return "Firstname and Lastname are both required fields";
        }
        
        // if the date has been entered then confirm its a valid date
        if (attrs.dob && !moment(attrs.dob, 'YYYY-MM-DD', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
        
    },
    
});

var SigninDetailedModel = Backbone.Model.extend({
    urlRoot: 'php/signinJS.php/details/',
    
    defaults: {
        selected: false
    },
    
    validate: function(attrs, options) {
        
        if (!attrs.id || !attrs.service_name || !attrs.provider_name) {
            return "A DB issue occurred retrieving services, please contact Administrator";
        }
    },
    
    parse: function(response, xhr) {
       //console.log("parse called!");
       //console.log(xhr);
        return response;
    }
    
});


var AppointmentModel = Backbone.Model.extend({
    urlRoot: "php/apptsJS.php/signin/",
    defaults: {
        client: {},
        staff: {},
        start_datetime: '',
        end_datetime: '',
        signature_filename: '',
        mva: false
    },
    validate: function(attrs, options) {
        if (!moment(attrs.end_datetime, ['DD-MMMM-YYYY hh:mmA', 'YYYY-MM-DD HH:mm:ss']).isValid()) {
            //console.log('not a valid date ' + attrs.end_datetime);
            return "Sign out date is not a date";
        }
    },
});
