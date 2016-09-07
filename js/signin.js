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
        console.log("parse called!");
        console.log(xhr);
        return response;
    }
    
});

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
            console.log('adding a service ' + JSON.stringify(this.model.toJSON));
            
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

var SigninView = Backbone.View.extend({
    model: SigninModel
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

/*

TODO:
- fix the number of services returned with counts of appointments left
- fix the 'User not found' dialog returned when I use Rola Tahboub
- fix when 'cancel' is clicked and #signature becomes unusable (no height)

*/

var SigninAppView = Backbone.View.extend({
    el: '.signincontainer',
    initialize: function() {
        //console.log('init signinapp');
        //console.log($('#signinbtn'));
        
        matchingPatients.on('reset', this.checkDuplicity, this);
        //appointmentsCollection.on('reset', this.addAppointment, this);
        
    },
    events: {
        //'blur #lastname': 'signin',
        //'blur #day': 'signin',
        'keypress #lastname': 'updateOnEnter',
        'click #signinbtn': 'signin',
        'click #signoutbtn': 'signout',
        'click #finished': 'commitSignin'
    },
    addAppointment: function(signinModel) {
        //console.log('in addAppointment() .. appointmentModel says ' + JSON.stringify(appointmentModel.toJSON()));
        var s_view = new SigninView({model: signinModel});
        $('#signin-section').append(view_appt.render().el);
    },
    checkDuplicity: function() {
        //console.log('checking duplicity');
    },
    addAll: function(){
        //console.log('in addall()');
        
        this.$('#appointments-table').html($('#appointments-header').html()); // clean the appointments table
        //console.log("appointmentsCollection has " + appointmentsCollection.length);
        
        // If any of the filter fields are filled then apply the filter
        if ($('#firstname_filter').val() || $('#lastname_filter').val() || $('#date_to').val() || $('#date_from').val()) {
            
            //console.log('filter found! ' + $('#firstname_filter').val() + ' ' + $('#lastname_filter').val());
            
            var firstname_filter = $('#firstname_filter').val().toLowerCase();
            var lastname_filter = $('#lastname_filter').val().toLowerCase();
            var date_from_filter = $('#date_from').val();
            var date_to_filter = $('#date_to').val();
            
            var date_from = moment(date_from_filter, "YYYY-MM-DD").subtract(1,'d');
            var date_to = moment(date_to_filter, "YYYY-MM-DD");
            
            if ((firstname_filter || lastname_filter || date_from_filter || date_to_filter) && date_to.isValid() && date_from.isValid()) {
                var ac = appointmentsCollection.filter(function(appmodel) {
                    //console.log(appmodel);

                    var appt_timedate = moment(appmodel.get('start_datetime').split(' ')[0], "DD-MMMM-YYYY");                    
                    
                    if ((appmodel.get('firstname').toLowerCase() === firstname_filter || !firstname_filter) && (appmodel.get('lastname').toLowerCase() === lastname_filter || !lastname_filter) && appt_timedate.isBetween(date_from, date_to, 'day')) {
                        return true;
                    } else {
                        return false;
                    }
                });
                
                if (ac.length) {
                    _.each(ac, this.addAppointment);
                } else {
                    this.$('#appointments-table').html('<tr><td bgcolor="white" border="0" align="center">0 appointments matching the above filter</tr></td>'); // clean the appointments table
                }
                //this.addAppointment(ac);
                //appointmentsCollection.append(ac);
            }
            
        }

    },
    reloadAppointments: function() {
        
        //console.log('reloading');
        appointmentsCollection.fetch({
            reset: true,
            data: { 
                from: appointmentsCollection.date_from,
                to: appointmentsCollection.date_to,
                page: appointmentsCollection.page,
                page_size: appointmentsCollection.page_size
            }
        });        
    },
    updateOnEnter: function(e) {
        //console.log(e.which);
        if (e.which === 13) {
            this.signin(e);
            e.currentTarget.blur();
        }
    },
    updateFilterOnEnter: function(e) {
        if ((e.which === 13 && e.currentTarget.id === 'firstname_filter') || (e.which === 13 && e.currentTarget.id === 'lastname_filter')) {
            this.addAll();
            e.currentTarget.blur();
        }
    },
    showService: function(signin_detail_model) {
        //console.log('what is this? ');
        //console.log(this);
        //console.log(signin_detail_model);
        var signin_service_view = new SigninServicesView({model: signin_detail_model, parent: this});
        $('#services-inner-container').append(signin_service_view.render().el);
        $('#services-outer-container').show();
    },
    signin_model: {},
    signin_details: {},
    commitSignin: function() {
        var self = this;
        
        // signin_model.services only contains the services selected by the patient
        // signin_details is a SigninDetailedCollection
        
        this.signin_model.save({},{
            success: function(model, response) {
                
                // initialize the remaining services statement
                var services_remaining_statement = "";
                var these_services = self.signin_details.models;
                
                if (response.length > 0) {
                    services_remaining_statement = "<br>Services Summary<br>";
                    for (var i=0; i<response.length; i++) {
                                                
                        if (response[i].remaining_appts >= 0) {
                            services_remaining_statement += "<br>" + response[i].provider_name + ': ' + response[i].service_name + ' ' + response[i].remaining_appts + ' remaining';
                        } else {
                            services_remaining_statement += "<br>" + response[i].provider_name + ': ' + response[i].service_name + ' ' + -response[i].remaining_appts + ' had';
                        }
                                                
                    }
                }
                
                self.reportSuccess("Thank you for signing in.  Please see reception now" + services_remaining_statement);
                
                self.signin_model.unbind();
                self.clearForm();

            },
            error: function() {
                //console.log(this.errorThrown);
                errorsdialog.show('issue connecting to database', true);
            }
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

        $('#buttonscontainer').addClass('hiddensignincontainer');
        $('#pleasewait').removeClass('pleasewaithidden');
        //$('#buttonscontainer').removeClass('signincontainer');

                
        this.signin_model = new SigninModel({
            firstname: firstname,
            lastname: lastname,
            dob: dob,
            sig: '',
            services: []
        });
        
        //console.log('valid? ' + signinModel.isValid());
        this.signin_details = new SigninDetailedCollection({});
    
        if (this.signin_model.isValid()) {
            var signinView = new SigninView({model: this.signin_model });
            var self = this;
            
            matchingPatients = new MatchingPatients([], {firstname: firstname, lastname: lastname, dob: dob});
            
            matchingPatients.fetch({
                reset: true,
                data: { 
                    firstname: matchingPatients.firstname,
                    lastname: matchingPatients.lastname,
                    dob: matchingPatients.dob
                },
                success: function() {
                    
                    //console.log('success ' + JSON.stringify(matchingPatients.toJSON()));
                    if (matchingPatients.length === 0) {

                        errorsdialog.show('user not found');
                        $('#buttonscontainer').removeClass('hiddensignincontainer');
                        $('#pleasewait').addClass('pleasewaithidden');
                        return;
        
                    }  else if (matchingPatients.length > 1) {
                        
                        $('#buttonscontainer').addClass('hiddensignincontainer');
                        // multiple clients found matching the first and last name, ask for date of birth
                        
                        //console.log('multiple entries found ' + matchingPatients.length);
                        $('#dob').addClass('datefieldshow');
                        $('#dob').removeClass('datefieldhide');
                        $('#datefieldmsg').addClass('datefieldmsgshow');
                        $('#datefieldmsg').removeClass('datefieldhide');
                        //errorsdialog.show("Please enter your date of birth", false);
                        //setTimeout(function() { $("#year").focus(); }, 4000);
                        $('#buttonscontainer').removeClass('hiddensignincontainer');
                        $('#pleasewait').addClass('pleasewaithidden');                        
                        
                    } else if (e.type === 'click' || e.which === 13) {
                        
                        
                        var sigval = $('#signature')
                        var data = sigval.jSignature('getData','svg');
                        var data_str = data[1];
                                    
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
                            
                            console.log(this);
                            
                            //console.log(data_str[1]);
                            self.signin_model.attributes['sig'] = data_str[1];
                            self.signin_model.attributes['client_id'] = matchingPatients.at(0).id;

                            // client has no services, just proceed to record the appointment
                            
                            // get all services for the client signing in
                            self.signin_details.fetch({
                                data: {cid: matchingPatients.at(0).id},
                                success: function() {
                                    console.log(self.signin_details);
                                
                                    // if client has services then list them and allow him/her to select today's services
                                    if (self.signin_details.length > 0) {
                                    
                                        $('#services-inner-container').html('');
                                        $('#services-inner-container').append('<p style="color:red">select all the services for today');
                                        $('#signature').hide();
                                        $('#buttonscontainer').hide();

                                        self.signin_details.each(self.showService, self);
                                    
                                    } else {
                                        
                                        // client has no services, just save the appointment
                                        var committing = self.commitSignin.bind(self);
                                        committing();
                                        console.log(self.signin_model);
                                        
                                    }
                                    $('#buttonscontainer').removeClass('hiddensignincontainer');
                                    $('#pleasewait').addClass('pleasewaithidden');

                                } // end signin_details.fetch success
                            }); // end signin_details
                        }
                    }
                },
                error: function() {
                    errorsdialog.show('issue connecting to database', true);
                    $('#buttonscontainer').removeClass('hiddensignincontainer');
                    $('#pleasewait').addClass('pleasewaithidden');
                    return;
                }
            });

        } else {
            errorsdialog.show(this.signin_model.validationError, '#FF0000');
            $('#buttonscontainer').removeClass('hiddensignincontainer');
            $('#pleasewait').addClass('pleasewaithidden');
            return;
        }
    
        //console.log(e.type);
        //console.log(matchingPatients.length);        

    },
    reportSuccess: function(message) {
        //document.resetForm();
        //errorsdialog.show(message, '#00AAFF');
        errorsdialog.show(message, false);
        $("#signature").jSignature("reset");
        document.forms["loginform"].reset();
        $("#datefieldmsg").removeClass("datefieldmsgshow");
        $("#datefieldmsg").addClass("datefieldhide");
        $('#dob').removeClass('datefieldshow');
        $('#dob').addClass('datefieldhide');
        $('#services-container').html('');

    },
    clearForm: function() {
        $('#services-inner-container').html('');
        $('#services-outer-container').hide();
        $('#buttonscontainer').show();
        $('#signature').show();
    },
    signout: function(e) {
        //console.log('signout clicked');
        //console.log('firstname is ' + $('#firstname').val());
        
        var firstname = $('#firstname').val();
        var lastname = $('#lastname').val();
        var dob = $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val();
        
        if (dob === '--') {
            dob = '';
        }
        
        $('#buttonscontainer').addClass('hiddensignincontainer');
        $('#pleasewait').removeClass('pleasewaithidden');

        // retreive the signinModel for signing out
        var signinModel = new SigninModel({
            firstname: firstname,
            lastname: lastname,
            dob: dob,
            sig: ''
        });

        // check that the signinModel is valid
        //console.log('valid? ' + signinModel.isValid());
        if (signinModel.isValid()) {
            
            var signinView = new SigninView({model: signinModel });
            var self = this;
            
            // retreive all patients that match firstname, lastname and dob provided
            matchingPatients = new MatchingPatients([], {firstname: firstname, lastname: lastname, dob: dob});
            //console.log(this);
            matchingPatients.fetch({
                
                reset: true,
                
                data: { 
                    firstname: matchingPatients.firstname,
                    lastname: matchingPatients.lastname,
                    dob: matchingPatients.dob
                },
                
                success: function() {

                    //console.log('success ' + JSON.stringify(matchingPatients.toJSON()));
                    //console.log("signed in?" + matchingPatients.models[0].get('signed_in'));
                    
                    // no patient matches firstname, lastname and dob provided
                    if (matchingPatients.length === 0) {

                        errorsdialog.show('client not found');
                        $('#buttonscontainer').removeClass('hiddensignincontainer');
                        $('#pleasewait').addClass('pleasewaithidden');
                        return;
                
                    // more than one patient matches firstname, lastname and dob provided
                    } else if (matchingPatients.length > 1) {
                        
                        // multiple clients found matching the first and last name, ask for date of birth
                        
                        //console.log('multiple entries found ' + matchingPatients.length);
                        $('#dob').addClass('datefieldshow');
                        $('#dob').removeClass('datefieldhide');
                        $('#datefieldmsg').addClass('datefieldmsgshow');
                        $('#datefieldmsg').removeClass('datefieldhide');
                        errorsdialog.show("Please enter your date of birth", false);
                        $('#year').focus();
                        $('#buttonscontainer').removeClass('hiddensignincontainer');
                        $('#pleasewait').addClass('pleasewaithidden');
                    
                    // one patient found but patient is not signed in at the moment
                    } else if (matchingPatients.models[0].get('signed_in') == false) {
                
                        errorsdialog.show('You are not signed in at the moment', '#FF0000');
                        $('#buttonscontainer').removeClass('hiddensignincontainer');
                        $('#pleasewait').addClass('pleasewaithidden');
                        return;
                    
                    // one patient found and patient is signed in at the moment    
                    } else if (e.type === 'click') {
                        
                        //console.log('looking for appointment with ID = ' + matchingPatients.models[0].get('last_appointment_id'));
                        //this.appointmentModel = new AppointmentModel({id: matchingPatients.models[0].get('last_appointment_id')});
                        var appointmentModel = new AppointmentModel({});
                        appointmentModel.fetch({
                            
                            data: {
                                id: matchingPatients.models[0].get('last_appointment_id') 
                            },
                            
                            success: function() {
                                //console.log('found the appointment!!');
                                //console.log(this.appointmentModel);
                                
                                appointmentModel.save({
                                    end_datetime: function(m) {
                                        return moment().format('YYYY-MM-DD HH:mm:ss');
                                    }(appointmentModel)
                                },
                                {   success: function() {
                                        //errorsdialog.show('signed out successfully', '#0000FF');
                                        self.reportSuccess("Thank you for signing out");
                                        $('#signature').show();
                                    },
                                    error: function() {
                                        errorsdialog.show('issue connecting to database', true);
                                    }
                                });

                                $('#buttonscontainer').removeClass('hiddensignincontainer');
                                $('#pleasewait').addClass('pleasewaithidden');

                            }
                        });
                    }
                },
                error: function() {
                    errorsdialog.show('issue connecting to database', true);
                    $('#buttonscontainer').removeClass('hiddensignincontainer');
                    $('#pleasewait').addClass('pleasewaithidden');                    
                    return;
                }

            });
        } else {
            errorsdialog.show(signinModel.validationError, true);
            $('#buttonscontainer').removeClass('hiddensignincontainer');
            $('#pleasewait').addClass('pleasewaithidden');
            return;
        }

        
    },
});


//var appointmentsCollection = new AppointmentsCollection([], {date_from: moment().subtract(1,"M").format("YYYY-MM-DD"), date_to: moment().format("YYYY-MM-DD")});
/*
var appointmentsCollection = new AppointmentsCollection([], {date_from: $('#date_from'), date_to: $('#date_to')});

appointmentsCollection.fetch({
    reset: true,
    data: { 
        from: appointmentsCollection.date_from,
        to: appointmentsCollection.date_to,
        page: appointmentsCollection.page,
        page_size: appointmentsCollection.page_size
    }
});
*/
//console.log($('#date_from').val() + " " + $('#date_to').val());
//console.log("appointmentsCollection.length: " + appointmentsCollection.length);

var matchingPatients = new MatchingPatients({});
var signinappview = new SigninAppView();
