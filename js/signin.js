"use strict";

var SigninServicesView = Backbone.View.extend({
    model: SigninDetailedModel,
    tagName: 'div',
    template: _.template($('#services-template').html()),
    className: 'checkboxdivunselected',
    
    events: {  
        'click': 'markSelected',
    },
    
    initialize: function(options) {
        
        if (options) {
            this.listenTo(options.parent, 'close:all', this.quit);
        }
    },
    render: function() {
                
        //console.log('rendering the SigninServicesView ' + this.template(this.model.toJSON()));
        this.$el.html(this.template(this.model.toJSON()));

        return this;
    },
    markSelected: function(e) {
        
        if (!this.model.selected) {
            this.model.selected = true;
           //console.log('adding a service ' + JSON.stringify(this.model.toJSON));
            
            // add the selected model to the services array
            signinappview.signin_model.attributes.services.push(this.model);
            this.$el.addClass('checkboxdivselected');
            this.$el.removeClass('checkboxdivunselected');
        } else {
            this.model.selected = false;
            var obj_index = signinappview.signin_model.attributes.services.indexOf(this.model);
            
            // remove the service from the services array
            if (obj_index != -1) {
                signinappview.signin_model.attributes.services.splice(obj_index, 1);
            }
            this.$el.addClass('checkboxdivunselected');            
            this.$el.removeClass('checkboxdivselected');
        }
    }
});

/*

TODO:
- fix the number of services returned with counts of appointments left
- fix when 'cancel' is clicked and #signature becomes unusable (no height)

*/

var SigninAppView = Backbone.View.extend({
    el: '.signincontainer',
    initialize: function() {
        
        //allPatients.on('reset', this.checkDuplicity, this);
        this.signin_details = new SigninDetailedCollection();

        // load in all the patients to start
        allPatients.fetch({
            
            reset: true,
            wait: true,
            success: function(c, r, o) {
                console.log("data retrieved successfully");
            },
            error: function(c, r, o) {
                console.log("failed to retreive data");
            }
        });

        // load in all the available services for all patients
        this.signin_details.fetch({
            reset: true,
            wait: true,
            success: function(c, r, o) {
                console.log("data retrieved successfully");
            },
            error: function(c, r, o) {
                console.log("failed to retreive data");
            }
        });

        // retrieve all of today's appointments - in case we go offline, we can just update this collection
        this.todays_appointments = new TodaysAppointmentsCollection({});
        this.todays_appointments.fetch({
            reset: true,
            wait: true,
        });
        
        var self = this;

        var int = window.setInterval(
            function() {
                // make sure to synchronize new registrations before any appointments
                if (allPatients.dirtyModels().length == 0) {
                    self.todays_appointments.syncDirtyAndDestroyed();
                    //console.log('synced todays_appointments');
                }
        }, 60000);

        console.log("signin interval job id: " + int);

        var testacct = new PatientModel();

        var int = window.setInterval(
            function() {
                testacct.fetch({
                    url: 'php/matchPatients.php/testconn/',
                    data: {
                        'firstname':'fadi',
                        'lastname':'hafez',
                    },
                    success: function(m, r, o) {
                        if (o.dirty) {
                            //console.log('offline!');
                            $('#offlinediv').removeClass('offlinedivhide');
                            $('#offlinediv').addClass('offlinedivshow');
                        } else {
                            //console.log('online!');
                            $('#offlinediv').removeClass('offlinedivshow');
                            $('#offlinediv').addClass('offlinedivhide');
                        }
                    }
                });
        }, 60000);


    },
    events: {
        'keypress #lastname': 'updateOnEnter',
        'click #signinbtn': 'signin',
        'click #signoutbtn': 'signout',
        'click #finished': 'commitSignin'
    },
    updateOnEnter: function(e) {
        //console.log(e.which);
        if (e.which === 13) {
            this.signin(e);
            e.currentTarget.blur();
        }
    },
    showService: function(signin_detail_model) {
        var signin_service_view = new SigninServicesView({model: signin_detail_model, parent: this});
        $('#services-inner-container').append(signin_service_view.render().el);
        this.displayed_services.push(signin_service_view);
    },
    signin_model: {},
    signin_details: {},
    displayed_services: [],
    todays_appointments: {},
    commitSignin: function() {
        var self = this;
        
        // signin_model.services only contains the services selected by the patient
        // signin_details is a SigninDetailedCollection

        var this_appointment = this.todays_appointments.add(this.signin_model);

        this_appointment.save({},{
            success: function(model, response, options) {
               

                // initialize the remaining services statement
                var services_remaining_statement = "";
                var patient_services = self.signin_details.where({
                    "client_id": self.signin_model.get('client_id'),
                });

                if (patient_services.length > 0) {
                    services_remaining_statement = "<br>Services Summary<br>";
                    _.each(patient_services, function(service) {

                        if (service.get('remaining_appts') >= 0) {
                            services_remaining_statement += "<br>" + service.get('provider_name') + ': ' + service.get('service_name') + ' ' + service.get('remaining_appts') + ' remaining';
                        } else {
                            services_remaining_statement += "<br>" + service.get('provider_name') + ': ' + service.get('service_name') + ' ' + -service.get('remaining_appts') + ' over';
                        }
                    }, self);
                }
                
                self.reportSuccess("Thank you for signing in.  Please see reception now" + services_remaining_statement);
                
                if (options.dirty) {
                    console.log('saved locally');
                    $('#offlinediv').removeClass('offlinedivhide');
                    $('#offlinediv').addClass('offlinedivshow');
                } else {
                    console.log('saved remotely');
                    $('#offlinediv').removeClass('offlinedivshow');
                    $('#offlinediv').addClass('offlinedivhide');
                }

                self.signin_model.unbind();
                self.clearForm();
                self.displayed_services.forEach(function (ds) {
                    ds.remove();
                });

            },
            error: function(m, r, o) {
                //console.log(this.errorThrown);
                errorsdialog.show('issue connecting to database', true);
            },
            wait: false,
            timeout: 1000,
//            remote: false,
        });

    },
    signin: function(e) {
        //console.log('signin clicked');
        //console.log(e);
        
        var firstname = $('#firstname').val();
        var lastname = $('#lastname').val();
        var dob = $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val();
        
        if (dob === '--') {
            dob = '';
        }

        var self = this;
        var matches;

        if (dob == '') {
            matches = allPatients.where({
                firstname: firstname,
                lastname: lastname
            }, 
            false,
            {caseInsensitive: true});
        } else {
            matches = allPatients.where({
                firstname: firstname,
                lastname: lastname,
                dob: dob
            },
            false,
            {caseInsensitive: true});
        }

        if (matches.length == 0) {
            errorsdialog.show('user not found', true);
            $('#buttonscontainer').removeClass('hiddensignincontainer');
            $('#pleasewait').addClass('pleasewaithidden');
            return;
        } else if (matches.length > 1) {
            $('#buttonscontainer').addClass('hiddensignincontainer');
            // multiple clients found matching the first and last name, ask for date of birth
            
            $('#dob').addClass('datefieldshow');
            $('#dob').removeClass('datefieldhide');
            $('#datefieldrequiredmsg').addClass('datefieldmsgshow');
            $('#datefieldrequiredmsg').removeClass('datefieldhide');
            $('#buttonscontainer').removeClass('hiddensignincontainer');
            $('#pleasewait').addClass('pleasewaithidden');                        

        } else if (e.type === 'click' || e.which === 13) {

            var sigval = $('#signature')
            var data = sigval.jSignature('getData','svg');
            var data_str = data[1];
            var stopSignIn = false;
            
            // if the client has only registered offline and has not been synced to DB then we cannot proceed
            allPatients.dirtyModels().forEach(function(dm) {
                if (dm.get('id') == matches[0].get('id')) {
                    errorsdialog.show('You cannot sign in while system is offline.  Please let the staff at the front desk know.', true);
                    stopSignIn = true;
                    return;
                }
            });

            if (stopSignIn) {
                $("#signature").jSignature("reset");
                document.forms["loginform"].reset();                
                self.clearForm();
                return;
            }

            // if the client forgot to sign in then stop and let them know
            if (data_str.indexOf('width="0" height="0"') !== -1) {

                errorsdialog.show('oops... looks like you forgot to sign');
                $('#buttonscontainer').removeClass('hiddensignincontainer');
                $('#pleasewait').addClass('pleasewaithidden');
                return;

            } else {

                // client has signed in
                // a single client found

                // record the appointment
                var data_str = sigval.jSignature('getData','svgbase64');
                
                this.signin_model = new SigninModel({
                    firstname: firstname,
                    lastname: lastname,
                    dob: dob,
                    sig: data_str[1],
                    services: [],
                    client_id: matches[0].id,
                    signed_in: true
                });        
                
                // get all services for the client signing in
                var client_services = this.signin_details.where({client_id: matches[0].id})
                    
                // if client has services then list them and allow him/her to select today's services
                if (client_services.length > 0) {
                
                    $('#services-inner-container').html('');
                    $('#services-inner-container').append('<p class="select-services-p">select all the services for today');
                    $('#signature').hide();
                    $('#buttonscontainer').hide();

                    //client_services.each(self.showService, self);
                    _.each(client_services, self.showService, self);
                    $('#nameFields').hide();
                    $('#services-outer-container').show();
                
                } else {
                    
                    // client has no services, just save the appointment
                    var committing = self.commitSignin.bind(self);
                    committing();

                   //console.log(self.signin_model);
                    
                }

                // mark the patient as signed in
                matches[0].set('signed_in', true);

                $('#buttonscontainer').removeClass('hiddensignincontainer');
                $('#pleasewait').addClass('pleasewaithidden');
            }

        }     

    },
    reportSuccess: function(message) {
        errorsdialog.show(message, false);
        $("#signature").jSignature("reset");
        document.forms["loginform"].reset();
        $("#datefieldrequiredmsg").removeClass("datefieldmsgshow");
        $("#datefieldrequiredmsg").addClass("datefieldhide");
        $('#dob').removeClass('datefieldshow');
        $('#dob').addClass('datefieldhide');
        $('#services-container').html('');

    },
    clearForm: function() {
        $('#services-inner-container').html('');
        $('#services-outer-container').hide();
        $('#buttonscontainer').show();
        $('#nameFields').show();
        $('#signature').show();
    },
    signout: function(e) {
        
        var firstname = $('#firstname').val();
        var lastname = $('#lastname').val();
        var dob = $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val();
        
        var self = this;
        var matches;
            
        if (dob === '--') {
            dob = '';
        }

        if (dob == '') {
            matches = allPatients.where({
                firstname: firstname,
                lastname: lastname
            }, 
            false,
            {caseInsensitive: true});
        } else {
            matches = allPatients.where({
                firstname: firstname,
                lastname: lastname,
                dob: dob
            },
            false,
            {caseInsensitive: true});
        }
        
                
        // no patient matches firstname, lastname and dob provided
        if (matches.length === 0) {

            errorsdialog.show('client not found');
            return;
    
        // more than one patient matches firstname, lastname and dob provided
        } else if (matches.length > 1) {
            
            // multiple clients found matching the first and last name, ask for date of birth
            
            $('#dob').addClass('datefieldshow');
            $('#dob').removeClass('datefieldhide');
            $('#datefieldrequiredmsg').addClass('datefieldmsgshow');
            $('#datefieldrequiredmsg').removeClass('datefieldhide');
            errorsdialog.show("Please enter your date of birth", false);
            $('#year').focus();
        
        // one patient found but patient is not signed in at the moment
        } else if (matches[0].get('signed_in') == false) {
    
            errorsdialog.show('You are not signed in at the moment', '#FF0000');
            return;
        
        // one patient found and patient is signed in at the moment    
        } else if (e.type === 'click') {

            var todays_appointments_for_patient = this.todays_appointments.where({
                client_id: matches[0].get('id'),
            });

            // patient had multiple appointments today
            if (todays_appointments_for_patient.length > 0) {

                // select only the last appointment today
                var last_appointment = todays_appointments_for_patient[todays_appointments_for_patient.length - 1];

                var stopSignOut = false;

                // patient can only sign out if the appointment was synced with DB already (system was online sometime after appointment was created)
                this.todays_appointments.dirtyModels().forEach(function(dm) {
                    if (dm.get('id') == last_appointment.get('id')) {
                        errorsdialog.show('You cannot sign out while system is offline.  Please let the staff at the front desk know.', true);
                        stopSignOut = true;
                        return;
                    }
                });

                if (stopSignOut) {
                    $("#signature").jSignature("reset");
                    document.forms["loginform"].reset();                
                    self.clearForm();
                    return;
                }

                // mark the patient as signed out
                matches[0].set('signed_in', false);

                // mark the appointment as signed out and datetime stamp it
                last_appointment.save({
                        'signout_date': moment().format('YYYY-MM-DD HH:mm:ss'),
                        'signed_in': false
                    },{
                    success: function(model, response, options) {

                        // initialize the remaining services statement
                        var services_remaining_statement = "";
                        var patient_services = self.signin_details.where({
                            "client_id": matches[0].get('id'),
                        });

                        if (patient_services.length > 0) {
                            services_remaining_statement = "<br>Services Summary<br>";
                            _.each(patient_services, function(service) {

                                if (service.get('remaining_appts') >= 0) {
                                    services_remaining_statement += "<br>" + service.get('provider_name') + ': ' + service.get('service_name') + ' ' + service.get('remaining_appts') + ' remaining';
                                } else {
                                    services_remaining_statement += "<br>" + service.get('provider_name') + ': ' + service.get('service_name') + ' ' + -service.get('remaining_appts') + ' over';
                                }
                            }, self);
                        }

                        if (options.dirty) {
                            console.log('saved locally');
                            $('#offlinediv').removeClass('offlinedivhide');
                            $('#offlinediv').addClass('offlinedivshow');
                        } else {
                            console.log('saved remotely');
                            $('#offlinediv').removeClass('offlinedivshow');
                            $('#offlinediv').addClass('offlinedivhide');
                        }

                        self.reportSuccess("Thank you for signing out" + services_remaining_statement);
                        self.clearForm();

                    },
                    error: function(m, r, o) {
                        //console.log(this.errorThrown);
                        errorsdialog.show('issue connecting to database', true);
                    },
                    wait: false,
                    timeout: 1000,
//                    remote: false,
                });

            } else {
                errorsdialog.show('You are not signed in at the moment', '#FF0000');
                return;                
            }

        } else {
            errorsdialog.show(signinModel.validationError, true);
            $('#buttonscontainer').removeClass('hiddensignincontainer');
            $('#pleasewait').addClass('pleasewaithidden');
            return;
        }

        
    },
});

var allPatients = new MatchingPatients({});
var signinappview = new SigninAppView();
