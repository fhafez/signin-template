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
            
            this.model.attributes['remaining_appts']--;
            this.render();

            // add the selected model to the services array
            signinappview.signin_model.attributes.services.push(this.model);

            // update the local instance of the service
            var current_signin_details = signinappview.signin_details.get(this.model.id);
            current_signin_details.attributes['remaining_appts'] = this.model.attributes['remaining_appts'];

            this.$el.addClass('checkboxdivselected');
            this.$el.removeClass('checkboxdivunselected');
        } else {
            this.model.selected = false;
            var obj_index = signinappview.signin_model.attributes.services.indexOf(this.model);
            
            this.model.attributes['remaining_appts']++;
            this.render();

            // remove the service from the services array
            if (obj_index != -1) {
                signinappview.signin_model.attributes.services.splice(obj_index, 1);
            }

            // update the local instance of the service
            var current_signin_details = signinappview.signin_details.get(this.model.id);
            current_signin_details.attributes['remaining_appts'] = this.model.attributes['remaining_appts'];
            
            this.$el.addClass('checkboxdivunselected');            
            this.$el.removeClass('checkboxdivselected');
        }
    }
});

/*

TODO:
- fix the number of services returned with counts of appointments left

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
                //console.log("data retrieved successfully");
                errorsdialog.show('All data is downloaded.  Go ahead and use the sytem now.', false);
            },
            error: function(c, r, o) {
                //console.log("failed to retreive data");
            }
        });

        // load in all the available services for all patients
        this.signin_details.fetch({
            reset: true,
            wait: true,
            success: function(c, r, o) {
                //console.log("data retrieved successfully");
            },
            error: function(c, r, o) {
                //console.log("failed to retreive data");
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
                    self.todays_appointments.syncDirtyAndDestroyed({timeout: 15000});
                    console.log('synced todays_appointments');
                }
        }, 300000);

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
        }, 300000);


    },
    events: {
        'keypress #lastname': 'updateOnEnter',
//        'keyup #lastname': 'isItComplete',
        'click #signinbtn': 'signin',
        'click #signoutbtn': 'signout',
        'click #cancelbtn': 'cancelSignin',
        'click #finished': 'commitSignin'
    },
    updateOnEnter: function(e) {
        //console.log(e.which);
        if (e.which === 13) {
            this.signin(e);
            e.currentTarget.blur();
        }
    },
    isItComplete: function(e) {

            var matchingPatients = allPatients.filter(function(a) {
                if (a.get('firstname').toLowerCase() == $('#firstname').val().toLowerCase() && 
                   a.get('lastname').toLowerCase().startsWith($('#lastname').val().toLowerCase()))
                   return true;
            });

            if (matchingPatients.length == 1) {
                $('#lastname').val(matchingPatients[0].get('lastname'));
                $('#signature')[0].focus();
                console.log('found ' + matchingPatients[0].get('firstname'));
            }

    },
    showService: function(signin_detail_model) {
        var signin_service_view = new SigninServicesView({model: signin_detail_model, parent: this});
        $('#services-inner-container').append(signin_service_view.render().el);
        this.displayed_services.push(signin_service_view);
    },
    hideSignInContainer: function() {
        $('#buttonscontainer').removeClass('signincontainer');
        $('#buttonscontainer').addClass('hiddensignincontainer');
        $('#pleasewait').removeClass('pleasewaithidden');
    },
    displaySignInContainer: function() {
        $('#buttonscontainer').addClass('signincontainer');
        $('#buttonscontainer').removeClass('hiddensignincontainer');
        $('#pleasewait').addClass('pleasewaithidden');
    },
    cancelSignin: function() {

        var self = this;

        // loop through the services of the signin model and increment the remaining_appts counter for each
        this.signin_model.attributes.services.forEach(function(service) {
            self.signin_details.where({'id': service.attributes.id })[0].fetch();
        });

        this.displaySignInContainer();
    },
    signin_model: {},
    signin_details: [],
    displayed_services: [],
    todays_services: [],
    todays_appointments: [],
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

                    patient_services.forEach(function(ps) {
                        ps.selected=false;
                        ps.save({},{remote: false});
                    });
                }
                
                self.reportSuccess("Thank you for signing in.  Please see reception now" + services_remaining_statement);

/*                
                if (options.dirty) {
                    console.log('saved locally');
                    console.log(options);
                    $('#offlinediv').removeClass('offlinedivhide');
                    $('#offlinediv').addClass('offlinedivshow');
                } else {
                    console.log('saved remotely');
                    console.log(options);
                    $('#offlinediv').removeClass('offlinedivshow');
                    $('#offlinediv').addClass('offlinedivhide');
                }
*/

                self.signin_model.unbind();
                self.clearForm();
                self.displayed_services.forEach(function (ds) {
                    ds.remove();
                });

            },
            error: function(model, response, options) {
                errorsdialog.show('issue connecting to database', true);
                self.displaySignInContainer();

                window.generateError("signinappview.commitSignin", "error", response.responseText, "501", moment().format('YYYY-MM-DD HH:mm:ss'));

            },
            wait: false,
            timeout: 8000,
//            remote: true,
        });

    },
    finalChecksAndGetAllServices: function(matchingPatient) {

        var sigval = $('#signature');
        var data_str = sigval.jSignature('getData','svg')[1];
        var stopSignIn = false;
        
        if (!matchingPatient[0].isValid()) {
            errorsdialog.show(matchingPatient[0].validationError, true);
        }

        // if the client has only registered offline and has not been synced to DB then we cannot proceed
        allPatients.dirtyModels().forEach(function(dm) {
            if (dm.get('id') == matchingPatient[0].get('id')) {
                errorsdialog.show('You cannot sign in while system is offline.  Please let the staff at the front desk know.', true);
                stopSignIn = true;

                var logEntry = new LogEntry({
                    system: 'signinappview.finalChecksAndGetAllServices',
                    severity: 'error',
                    message: 'failed signin ' + newPatient.firstname + ' ' + newPatient.lastname,
                    errorcode: '501',
                    datetime:  moment().format('YYYY-MM-DD HH:mm:ss')
                });
                logEntry.save();

                return;
            }
        });

        if (stopSignIn) {
            $("#signature").jSignature("reset");
            document.forms["loginform"].reset();
            this.clearForm();
            this.displaySignInContainer();
            return;
        }

        // record the appointment
        var data_str = sigval.jSignature('getData','svgbase64');        

        this.signin_model = new SigninModel({
            firstname: matchingPatient[0].get('firstname'),
            lastname: matchingPatient[0].get('lastname'),
            dob: matchingPatient[0].get('dob'),
            sig: data_str[1],
            services: [],
            client_id: matchingPatient[0].get('id'),
            signed_in: true
        });        
        
        // get all services for the client signing in
        var client_services = this.signin_details.where({client_id: matchingPatient[0].id})
            
        // if client has services then list them and allow him/her to select today's services
        if (client_services.length > 0) {
        
            $('#services-inner-container').html('');
            $('#services-inner-container').append('<p class="select-services-p">select all the services for today');
            $('#signature').hide();
            //$('#buttonscontainer').hide();
            this.hideSignInContainer();
            $('#pleasewait').addClass('pleasewaithidden');

            //client_services.each(self.showService, self);
            _.each(client_services, this.showService, this);
            $('#nameFields').hide();
            $('#services-outer-container').show();
        
        } else {
            
            // client has no services, just save the appointment
            $('#pleasewait').addClass('pleasewaithidden');
            var committing = this.commitSignin.bind(this);
            committing();
            
        }

        // mark the patient as signed in
        matchingPatient[0].set('signed_in', true);


    },    
    checkRemoteDBForPatient: function(data) {

        var newPatient = [];
        var self = this;

        // lets try to fetch this user directly from the backend DB, if we're online
        if (!allPatients.dirtyModels().length) {
            newPatient = new MatchingPatients();
            newPatient.fetch({
                data: data,
                success: function(collection, response, options) {
                    if (collection.length == 0) {
                        errorsdialog.show('user not found', true);
                        self.displaySignInContainer();

                        var logEntry = new LogEntryModel({
                            system: 'signinappview.checkRemoteDBForPatient',
                            severity: 'error',
                            message: 'user not found ' + JSON.stringify(data),
                            errorcode: '404',
                            datetime:  moment().format('YYYY-MM-DD HH:mm:ss')
                        });
                        logEntry.save();
                        //self.newPatient.unbind();
                        self.newPatient = null;

                        return;
                    } else {

                        // WHAT IF MORE THAN 1 PATIENT IS RETURNED HERE??!?!
                        // NEEDS A FIX

                        self.finalChecksAndGetAllServices.call(self, collection.models);
                    }
                },
                error: function(collection, response, options) {
                    errorsdialog.show('user not found', true);
                    self.displaySignInContainer();

                    var logEntry = new LogEntryModel({
                        system: 'signinappview.checkRemoteDBForPatient',
                        severity: 'error',
                        message: 'user not found ' + JSON.stringify(data),
                        errorcode: '500',
                        datetime:  moment().format('YYYY-MM-DD HH:mm:ss')
                    });
                    logEntry.save();
                    self.newPatient.unbind();
                    self.newPatient = undefined;

                    return;
                }
            });
        }

    },    
    signin: function(e) {
        
        var firstname = $('#firstname').val().trim();
        var lastname = $('#lastname').val().trim();
        var dob = $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val();
        var sigval = $('#signature')
        var data_str = sigval.jSignature('getData','svg')[1];
        
        if (dob === '--') {
            dob = '';
        }

        var self = this;
        var matches;

        this.hideSignInContainer();

        if (firstname.length == 0 || lastname.length == 0) {
            errorsdialog.show('Must include firstname and lastname', true);
            this.displaySignInContainer();
            return;
        }

        // Did patient forget to sign?
        if (data_str.indexOf('width="0" height="0"') !== -1) {
            errorsdialog.show('oops... looks like you forgot to sign');
            this.displaySignInContainer();
            return;
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

        // no matches for this patient found locally, check remote DB
        if (matches.length == 0) {
            this.checkRemoteDBForPatient({firstname: firstname, lastname: lastname, dob: dob});
            //this.checkRemoteDBForPatient.call(this, {firstname: firstname, lastname: lastname, dob: dob});
        } else if (matches.length > 1) {

            $('#buttonscontainer').addClass('hiddensignincontainer');
            // multiple clients found matching the first and last name, ask for date of birth
            
            $('#dob').addClass('datefieldshow');
            $('#dob').addClass('datefieldhighlight');
            $('#dob').removeClass('datefieldhide');
            $('#datefieldrequiredmsg').addClass('datefieldmsgshow');
            $('#datefieldrequiredmsg').removeClass('datefieldhide');
            this.displaySignInContainer();

        } else if (e.type === 'click' || e.which === 13) {
            this.finalChecksAndGetAllServices.call(this, matches);
        }

    }, 
    reportSuccess: function(message) {
        errorsdialog.show(message, false);
        $("#signature").jSignature("reset");
        document.forms["loginform"].reset();
        $("#datefieldrequiredmsg").removeClass("datefieldmsgshow");
        $("#datefieldrequiredmsg").addClass("datefieldhide");
        $('#dob').removeClass('datefieldshow');
        $('#dob').removeClass('datefieldhighlight');
        $('#dob').addClass('datefieldhide');
        $('#services-container').html('');

    },
    clearForm: function() {
        $('#services-inner-container').html('');
        $('#services-outer-container').hide();
        //$('#buttonscontainer').show();
        this.displaySignInContainer();
        $('#nameFields').show();
        $('#signature').show();
    },
    signout: function(e) {
        
        var firstname = $('#firstname').val().trim();
        var lastname = $('#lastname').val().trim();
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
            $('#dob').addClass('datefieldhighlight');
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

/*
                        if (options.dirty) {
                            //console.log('saved locally');
                            $('#offlinediv').removeClass('offlinedivhide');
                            $('#offlinediv').addClass('offlinedivshow');
                        } else {
                            //console.log('saved remotely');
                            $('#offlinediv').removeClass('offlinedivshow');
                            $('#offlinediv').addClass('offlinedivhide');
                        }
*/
                        self.reportSuccess("Thank you for signing out" + services_remaining_statement);
                        self.clearForm();

                    },
                    error: function(m, r, o) {
                        //console.log(this.errorThrown);
                        errorsdialog.show('issue connecting to database', true);
                        var logEntry = new LogEntry({
                            system: 'signinappview.signout',
                            severity: 'error',
                            message: 'failed to signout',
                            errorcode: '500',
                            datetime:  moment().format('YYYY-MM-DD HH:mm:ss')
                        });
                        logEntry.save();
                    },
                    wait: false,
                    timeout: 8000,
                    remote: true,
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
