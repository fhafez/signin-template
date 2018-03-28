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
                //console.log('synced allPatients');
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
    hideButtonsContainer: function() {
        $('#registerbuttonscontainer').removeClass('registercontainer');
        $('#registerbuttonscontainer').addClass('hiddenregistercontainer');
        $('#registerpleasewait').removeClass('pleasewaithidden');
    },
    displayButtonsContainer: function() {
        $('#registerbuttonscontainer').addClass('registercontainer');
        $('#registerbuttonscontainer').removeClass('hiddenregistercontainer');
        $('#registerpleasewait').addClass('pleasewaithidden');
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
        
        this.hideButtonsContainer();

        var registerModel = new PatientModel({
            firstname: firstname,
            lastname: lastname,
            dob: dob,
        });

        //console.log('valid? ' + signinModel.isValid());
        
        if (registerModel.isValid({registration: true})) {
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
                this.displayButtonsContainer();
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

                        self.displayButtonsContainer();
                        self.reportSuccess("Registration complete.  Please sign in now");
                    },
                    error: function(model, response, options) {
                        //console.log(this.errorThrown);
                        self.displayButtonsContainer();
                        errorsdialog.show('issue connecting to database', true);
                    },
                    wait: false,
                    timeout: 5000
                });
            }      

        } else {
            this.displayButtonsContainer();
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
