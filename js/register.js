"use strict";

/*
var RegisterView = Backbone.View.extend({
    model: PatientModel
});
*/

var RegisterAppView = Backbone.View.extend({
    el: '#registercontainer',
    initialize: function() {
        
        allPatients.on('reset', this.checkDuplicity, this);

        var int = window.setInterval(
            function() {
                allPatients.syncDirtyAndDestroyed();
                console.log('synced allPatients');
            }, 60000);

        console.log("registration interval job id: " + int);

    },
    events: {
        //'keypress #lastname': 'updateOnEnter',
        'click #registerbtn': 'register',
    },
    updateOnEnter: function(e) {
        if (e.which === 13) {
            this.register();
            e.currentTarget.blur();
        }
    },
    register: function(e) {
        //console.log('signin clicked');
        //console.log(e);
        
        var firstname = $('#regfirstname').val().trim();
        var lastname = $('#reglastname').val().trim();
        var dob = $('#regyear').val() + '-' + $('#regmonth').val() + '-' + $('#regday').val();
        
        if (dob === '--') {
            dob = '';
        }
        
        var registerModel = new PatientModel({
            firstname: firstname,
            lastname: lastname,
            dob: dob,
        });

        //console.log('valid? ' + signinModel.isValid());
        
        if (registerModel.isValid()) {
            //var registerView = new RegisterView({model: registerModel });
            var self = this;
            
            var matches = allPatients.where({
                firstname: firstname,
                lastname: lastname,
                dob: dob
            },
            false,
            {caseInsensitive: true});


            if (matches.length > 0) {
                
                errorsdialog.show('A patient by that name and date of birth already exists', true);
                return;
                
            } else if (e.type === 'click') {                        
                
                var thisClient = allPatients.add(registerModel);
                thisClient.save({},{
                    success: function(model, response, options) {

                        if (options.dirty) {
                            console.log('saved locally');
                            $('#offlinediv').removeClass('offlinedivhide');
                            $('#offlinediv').addClass('offlinedivshow');
                        } else {
                            console.log('saved remotely');
                            $('#offlinediv').removeClass('offlinedivshow');
                            $('#offlinediv').addClass('offlinedivhide');
                        }

                        self.reportSuccess("Registration complete.  Please sign in now");
                    },
                    error: function(model, response, options) {
                        //console.log(this.errorThrown);
                        errorsdialog.show('issue connecting to database', true);
                    },
                    wait: false,
                    timeout: 1000
                });
            }      

        } else {
            errorsdialog.show(registerModel.validationError, '#FF0000');
            return;
        }
    
    },
    reportSuccess: function(message) {
        errorsdialog.show(message, false);
        document.forms["registerform"].reset();
    },
});

var registerappview = new RegisterAppView();
