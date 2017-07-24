"use strict";

var SigninDetailedCollection = Backbone.Collection.extend({
    url: 'php/signinJS.php/details/',
    model: SigninDetailedModel,
    defaults: {
    },
    
    validate: function() {
        
        if (!attrs.id || !attrs.service_name || !attrs.provider_name) {
            return "A DB issue occurred retrieving services, please contact Administrator";
        }
    }
    
});

var MatchingPatients = Backbone.Collection.extend({
    model: SigninModel,
    wait: true,
    url: 'php/matchPatients.php/',
    initialize: function(models, options) {
        //console.log(options);
        
        if (options) {
            this.firstname = options.firstname;
            this.lastname = options.lastname;
            this.dob = options.dob;
        }
    }
});

