var RegisterModel = Backbone.Model.extend({
    url: 'php/registerJS.php/',
    defaults: {
        firstname: '',
        lastname: '',
        birthdate: '',
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
        if (!attrs.lastname || !attrs.firstname || !attrs.dob) {
            return "Firstname, Lastname and Date of Birth are all required fields";
        }
        
        // if the date has been entered then confirm its a valid date
        if (attrs.dob && !moment(attrs.dob, 'YYYY-MM-DD', true).isValid()) {
            //console.log('not a valid date ' + attrs.dob);
            return "Birthdate is not a date";
        }
        
    },
    
});


var RegisterView = Backbone.View.extend({
    model: RegisterModel
});

var MatchingPatients = Backbone.Collection.extend({
    model: RegisterModel,
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

var RegisterAppView = Backbone.View.extend({
    el: '.registercontainer',
    initialize: function() {
        //console.log('init signinapp');
        //console.log($('#signinbtn'));
        
        matchingPatients.on('reset', this.checkDuplicity, this);
        //appointmentsCollection.on('reset', this.addAppointment, this);
        
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
        
        var firstname = $('#firstname').val();
        var lastname = $('#lastname').val();
        var dob = $('#year').val() + '-' + $('#month').val() + '-' + $('#day').val();
        
        if (dob === '--') {
            dob = '';
        }
        
        var registerModel = new RegisterModel({
            firstname: firstname,
            lastname: lastname,
            dob: dob,
        });
        
        //console.log('valid? ' + signinModel.isValid());
        
        if (registerModel.isValid()) {
            var registerView = new RegisterView({model: registerModel });
            var self = this;
            
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
                    if (matchingPatients.length > 0) {
                        
                        errorsdialog.show('A patient by that name and date of birth already exists', true);
                        return;
                        
                    } else if (e.type === 'click') {                        
                        
                        registerModel.save({},{
                            success: function() {
                                self.reportSuccess("Registration complete.  Please sign in now");
                            },
                            error: function() {
                                //console.log(this.errorThrown);
                                errorsdialog.show('issue connecting to database', true);
                            }
                        });
                    }
                },
                error: function() {
                    errorsdialog.show('issue connecting to database', true);
                    return;
                }
            });

        } else {
            errorsdialog.show(registerModel.validationError, '#FF0000');
            return;
        }
    
        //console.log(e.type);
        //console.log(matchingPatients.length);        

    },
    reportSuccess: function(message) {
        //document.resetForm();
        //errorsdialog.show(message, '#00AAFF');
        errorsdialog.show(message, false);
        document.forms["registerform"].reset();
    },
});


var matchingPatients = new MatchingPatients({});
var registerappview = new RegisterAppView();
