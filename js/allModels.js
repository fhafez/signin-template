"use strict";


var SigninModel = Backbone.Model.extend({
    urlRoot: 'php/signinJS.php',
    storeName: 'signin_',
    defaults: {
        firstname: '',
        lastname: '',
        birthdate: '',
        sig: '',
        signed_in: false,
        current_datetime: '',
        services: []
    },
    /*
    url: function() {
        return 'clientsJS.php/hello/' + this.id;
    },
    */
    initialize: function (options) {
        this.set('current_datetime', moment().format('YYYY-MM-DD HH:mm:ss'));
    },
    validate: function(attrs, options) {

        // both first and last name are required
        if (!attrs.lastname || !attrs.firstname) {
            return "Firstname and Lastname are both required fields";
        }
        
        // if the date has been entered then confirm its a valid date
        if (attrs.dob && !moment(attrs.dob, 'YYYY-MM-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-D', true).isValid() && !moment(attrs.dob, 'YYYY-MM-D', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
        
    },
    
});

var PatientModel = Backbone.Model.extend({
    urlRoot: 'php/matchPatients.php',
    storeName: 'allPatients_',    
    defaults: {
        //id: '',
        firstname: '',
        lastname: '',
        dob: '',
        signed_in: false,
        last_appointment_id: 0
    },
    initialize: function (options) {
        this.set('current_datetime', moment().format('YYYY-MM-DD HH:mm:ss'));
    },
    validate: function(attrs, options) {

        // both first and last name are required
        if (!attrs.lastname || !attrs.firstname) {
            return "Firstname and Lastname are both required fields";
        }
        
        // if the date has been entered then confirm its a valid date
        if (attrs.dob && !moment(attrs.dob, 'YYYY-MM-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-D', true).isValid() && !moment(attrs.dob, 'YYYY-MM-D', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
        
    },
    
});


var SigninDetailedModel = Backbone.Model.extend({
    urlRoot: 'php/signinJS.php/details/',
    storeName: 'signinDetails_',
    defaults: {
        selected: false
    },
    
    validate: function(attrs, options) {
        
        if (!attrs.id || !attrs.service_name || !attrs.provider_name) {
            return "A DB issue occurred retrieving services, please contact Administrator";
        }
    },
    
    parse: function(response, xhr) {
        return response;
    }
    
});

/*
var RegisterModel = Backbone.Model.extend({
    url: 'php/registerJS.php/',
    defaults: {
        firstname: '',
        lastname: '',
        birthdate: '',
    },
    initialize: function (options) {
        //this.id = options.id;
        //console.log('model created');
    },
    validate: function(attrs, options) {
        //console.log('in validate');
        //console.log(attrs);
        
        // both first and last name are required
        if (!attrs.lastname || !attrs.firstname || !attrs.dob) {
            return "Firstname, Lastname and Date of Birth are all required fields";
        }
        
        // if the date has been entered then confirm its a valid date
        if (attrs.dob && !moment(attrs.dob, 'YYYY-MM-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-DD', true).isValid() && !moment(attrs.dob, 'YYYY-M-D', true).isValid() && !moment(attrs.dob, 'YYYY-MM-D', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
        
    },
    
});
*/