"use strict";

function AppointmentsApp(el) {

    var StaffModel = Backbone.Model.extend({
        urlRoot: "../php/appointmentsJS.php/",
    });

    var AppointmentModel = Backbone.Model.extend({
        urlRoot: "../php/appointmentsJS.php/",
        defaults: {
            client: {},
            staff: {},
            start_datetime: '',
            end_datetime: '',
            signature_filename: '',
            mva: false
        },
        validate: function(attrs, options) {
            if (!moment(attrs.start_datetime, ['DD-MMMM-YYYY hh:mmA', 'YYYY-MM-DD HH:mm:ss']).isValid()) {
                //console.log('not a valid date ' + attrs.start_datetime);
                return "Sign in date is not a date";
            }
            /*
            if (!moment(attrs.end_datetime, ['DD-MMMM-YYYY hh:mmA', 'YYYY-MM-DD HH:mm:ss']).isValid()) {
                //console.log('not a valid date ' + attrs.end_datetime);
                return "Sign out date is not a date";
            }
            */
            if (!attrs.signature_filename) {
                return "Signature not provided";
            }
        },
    });

    var AppointmentView = Backbone.View.extend({
        tagName: 'tr',
        //model: AppointmentModel,
        template: _.template($('#appointments-template').html()),
        
        initialize: function(options) {
            //this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
            //this.model.on('change', this.render, this);
            //this.model.on('destroy', this.remove, this);
            
            if (options) {
                //options.parent.on('close:all', this.quit, this);
                this.listenTo(options.parent, 'close:all', this.quit);
                //console.log(options.parent);
            }

            this.staffCollection = options.staffCollection;

        },
        render: function() {
            //console.log('rendering AppointmentView');

            this.$el.html(this.template(this.model.toJSON()));
            
            return this;
        },
        events: {
            'click .destroy': 'destroy',
            'click .signout': 'checkSignOut',
            'mouseover': 'highlightRow',
            'mouseleave': 'unhighlightRow',
            'change #staff': 'changeStaff',
            'change #mva': 'changeMVA'
        },
        changeStaff: function(s) {
            //console.log(this.model);
            //console.log("new target value is " + s.target.value);
            this.model.attributes.staff.staff_id = s.target.value;
            this.model.save({
                end_datetime: function(m) {
                    return m.get('end_datetime') === null ? null : moment(m.get('end_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                }(this.model),
                start_datetime: function(m) {
                    return moment(m.get('start_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                }(this.model)
            });
        },
        changeMVA: function(m) {
            //console.log(this.model);
            //console.log("new target value is " + m.target.checked);
            this.model.attributes.mva = m.target.checked;
            this.model.save({
                end_datetime: function(m) {
                    return m.get('end_datetime') === null ? null : moment(m.get('end_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                }(this.model),
                start_datetime: function(m) {
                    console.log(m.get('start_datetime'));
                    return moment(m.get('start_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                }(this.model)
            });
        },
        destroy: function() {
          //console.log(this.model);
          if (confirm("Are you sure?")) {
            this.model.destroy();
            //appointmentsCollection.fetch({wait: true});
          }
        },
        checkSignOut: function(events) {

            // if this appointment has already signed out then don't allow to signout again
            if (this.model.get('end_datetime')) {
                return;
            }
            
            if (events.target.className === 'no') {
                this.$el.removeClass('signingout');            
            } else if (events.target.className === 'yes') {
                this.model.set('end_datetime', new moment().format("DD-MMMM-YYYY hh:mmA"));
               //console.log(this.model);
                this.model.save({
                    end_datetime: function(m) {
                        return moment(m.get('end_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                    }(this.model),
                    start_datetime: function(m) {
                        return moment(m.get('start_datetime'), "DD-MMMM-YYYY hh:mmA").format('YYYY-MM-DD HH:mm:ss');
                    }(this.model)
                });
               //console.log('saved');

                this.$el.removeClass('signingout');
            } else {
                this.$el.addClass('signingout');
            }
        },
        highlightRow: function() {
            this.$el.addClass('highlightrow');
            this.$el.get(0).lastElementChild.className = 'destroycellshow';
        },
        unhighlightRow: function() {
            this.$el.get(0).lastElementChild.className = 'destroycellhide';
            this.$el.removeClass('highlightrow');   
        },
        quit: function() {
           //console.log('quitting appointmentview');
            this.$el.empty();
            this.remove();
            this.unbind();
            this.model.unbind('change', this.render);
            this.model.unbind('destroy', this.remove);
            this.model = null;
        }
    });

    var StaffCollection = Backbone.Collection.extend({
        url: "../php/staffJS.php/"
    });

    var AppointmentsCollection = Backbone.Collection.extend({
        model: AppointmentModel,
        wait: true,
        url: "../php/appointmentsJS.php/",
        /*
        sync: function(method, model, options) {
            //console.log("appointments collection sync called! " + method);
            
            if (method === 'read') {
                $('.footer').html("Total Appointments: " + appointmentsCollection.length);            
            } else if (method === 'delete') {
                options.url = model.url = "appointmentsJS.php/";
                //console.log('deleting in collection');
            } else if (method === 'update') {
                //console.log('updating in collection');   
            }

            //Backbone.Collection.prototype.sync.apply(this, arguments); //continue using backbone's collection sync                
            return Backbone.sync(method, model, options);
        },
        */
        initialize: function(models, options) {

            console.log(this);

            this.first_record = 1;
            this.page_size = 1000;
            this.page = 1;
            this.listenTo(this, 'sync', this.syncComplete);

            //this.on('sync', this.syncComplete, this);
            
            options = options || {};
            
            this.date_from = options.date_from;
            this.date_to = options.date_to;
            
            // if no date was passed in then create the range of the last day
            if (!this.date_from || !this.date_to || isNaN((new Date(this.date_from)).getDate()) || isNaN((new Date(this.date_from)).getDate())) {
        
                this.date_from = (new moment()).subtract(2, 'd').format("YYYY-MM-DD");
                this.date_to = (new moment()).add(1,'d').format("YYYY-MM-DD");
                
               //console.log("fetching from " + this.date_from + " to " + this.date_to);
            }
            
            // set the date range variables accordingly
            this.setRange({date_from: this.date_from, date_to: this.date_to});
            //console.log("init: url is " + this.url());

        },
        /*
        url: function() { 
            //return 'appointmentsJS.php/all/' + this.date_from + '/' + this.date_to + '/' + this.first_record + '/' + this.page_size;
            return 'appointmentsJS.php/all/' + this.date_from + '/' + this.date_to;
        },
        */
        setRange: function(range) {
            
           //console.log('appointmentsColletion: setting range ' + JSON.stringify(range));
            var mom_date_from = moment(range.date_from, "YYYY-MM-DD");
            var mom_date_to = moment(range.date_to, "YYYY-MM-DD");
            
            if (mom_date_from.isValid() && mom_date_to.isValid()) {
                this.date_from = mom_date_from.format("YYYY-MM-DD");
                this.date_to = mom_date_to.format("YYYY-MM-DD");
                
                // update the date range fields in the DOM
                $('#date_from').val(this.date_from);
                $('#date_to').val(this.date_to);
            }
            
        },
        syncComplete: function() {

            console.log(this);
            console.log('appointmentsCollection sync completed!');
            var from_record = this.first_record;
            var to_record = Math.min(this.first_record + this.page_size, this.length);
            if (this.length) {
                $('.footer').html(from_record + " to " + to_record + " of " + this.length + " Total Appointments");
            } else {
                $('.footer').html("0 Total Appointments");   
            }
        },
        /*
        comparator: function(appointment) {
           //console.log(appointment);
            return [appointment.get("lastname")];
        },
        */
        nextPage: function() {
            if ((this.first_record + this.page_size) < this.length) {
                this.first_record += this.page_size;
                this.page++;
                //appointmentsappview.$el.removeClass('appt_next_page');
            }
        },
        lastPage: function() {
            if (this.page_size > this.first_record) {
                this.first_record = 1;
                this.page = 1;
            } else {
                this.first_record -= this.page_size;
                this.page--;
            }
        }
    });

    var AppointmentsAppView = Backbone.View.extend({
        //el: '#appointmentsapp',
        template: _.template($('#appointmentsapp-template').html()),
        initialize: function() {

            console.log(this);

            this.$el.html(this.template());
            
            this.appointmentsCollection = new AppointmentsCollection([], {date_from: $('#date_from'), date_to: $('#date_to')});
            this.staffCollection = new StaffCollection();

            this.staffCollection.fetch();

            //appointmentsCollection.on('add', this.addAppointment, this);

            this.listenTo(this.appointmentsCollection, 'reset', this.addAll);

            //appointmentsCollection.on('reset', this.addAll, this);
           //console.log("appointments fetched! " + appointmentsCollection.length);
            
            this.listenTo(this.appointmentsCollection, 'sort', this.reloadAppointments);
            //appointmentsCollection.on('sort', this.reloadAppointments, this);
            this.descending = false;

            _.bindAll(this, "renderAppointments");

            this.dayClicked();

            this.render();
            
        },
        render: function() {
            return this;
        },
        events: {
            
            //'click #reloadAppointments': 'reloadAppointments',
            'blur #date_from': 'reloadAppointments',
            'blur #date_to': 'reloadAppointments',
            'keypress #date_from': 'updateOnEnter',
            'keypress #date_to': 'updateOnEnter',
            'keypress #firstname_filter': 'updateFilterOnEnter',
            'keypress #lastname_filter': 'updateFilterOnEnter',
            'blur #firstname_filter': 'addAll',
            'blur #lastname_filter': 'addAll',
            'click #day': 'dayClicked',
            'click #week': 'weekClicked',
            'click #month': 'monthClicked',
            'click .appt_last_page': 'apptLastPage',
            'click .appt_next_page': 'apptNextPage',
            'click .end-time': 'apptSignOut',
            'click #firstname': 'sortAppointments',
            'click #lastname': 'sortAppointments',
            'click #signedin_at': 'sortAppointments',
            'click #signedout_at': 'sortAppointments'
        },
        addAppointment: function(appointmentModel) {
           //console.log('in addAppointment() .. appointmentModel says ' + JSON.stringify(appointmentModel.toJSON()));
           //console.log(this);
           //console.log(appointmentModel);

            var view_appt = new AppointmentView({model: appointmentModel, staffCollection: this.staffCollection, parent: this});
            $('#appointments-table').append(view_appt.render().el);
        },
        addAll: function() {
           console.log('addall() called from ');
           console.log(this);
            
            this.$('#appointments-table').html($('#appointments-header').html()); // clean the appointments table
           //console.log("appointmentsCollection has " + appointmentsCollection.length);
            
            // If any of the filter fields are filled then apply the filter
            if ($('#firstname_filter').val() || $('#lastname_filter').val() || $('#date_to').val() || $('#date_from').val()) {
                
               //console.log('filter found! ' + $('#firstname_filter').val() + ' ' + $('#lastname_filter').val());
                
                var firstname_filter = $('#firstname_filter').val().toLowerCase();
                var lastname_filter = $('#lastname_filter').val().toLowerCase();
                var date_from_filter = $('#date_from').val();
                var date_to_filter = $('#date_to').val();
                
               console.log('date_from_filter is ' + date_from_filter);
                
                var date_from = moment(date_from_filter, "YYYY-MM-DD").subtract(1,'d');
                var date_to = moment(date_to_filter, "YYYY-MM-DD");
                
                if ((firstname_filter || lastname_filter || date_from_filter || date_to_filter) && date_to.isValid() && date_from.isValid()) {

                    this.appointmentsCollection = null;
                    this.appointmentsCollection = new AppointmentsCollection([], {
                        date_from: date_from_filter,
                        date_to: date_to_filter,
                        firstname: firstname_filter,
                        lastname: lastname_filter,
                    });

                    this.appointmentsCollection.fetch({
                        reset: true,
                        data: {
                            from: date_from_filter,
                            to: date_to_filter,
                            page: this.appointmentsCollection.page,
                            page_size: this.appointmentsCollection.page_size,
                            firstname: firstname_filter,
                            lastname: lastname_filter                     
                        },
                        success: this.renderAppointments
                        
                    });

                    /*
                    var ac = this.appointmentsCollection.filter(function(appmodel) {
                       //console.log(appmodel);

                        var appt_timedate = moment(appmodel.get('start_datetime').split(' ')[0], "DD-MMMM-YYYY");                    
                        
                        if ((appmodel.get('firstname').toLowerCase() === firstname_filter || !firstname_filter) && (appmodel.get('lastname').toLowerCase() === lastname_filter || !lastname_filter) && appt_timedate.isBetween(date_from, date_to, 'day')) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    
                    console.log(ac);
                    console.log(this.appointmentsCollection);

                    */
                    //this.addAppointment(ac);
                    //appointmentsCollection.append(ac);

                }
                
            }
            
            // if the user has sorted by a column then underline that column header
            if (this.sortedBy) {
                $('#' + this.sortedBy).addClass('th_underline');
            }


        },
        renderAppointments: function(c, response) {
            
            //console.log(c);
            this.$('#appointments-table').html($('#appointments-header').html()); // clean the appointments table

            if (c.length) {
                c.each(this.addAppointment, this);
            } else {
                this.$('#appointments-table').html('<tr><td bgcolor="white" border="0" align="center">0 appointments matching the above filter</tr></td>'); // clean the appointments table
            }
        },
        reloadAppointments: function(e) {
            
           //console.log('reloading');
           //console.log('sorted by ' + this.sortedBy);

            //appointmentsCollection = new AppointmentsCollection([], {date_from: $('#date_from').val(), date_to: $('#date_to').val()});
            this.appointmentsCollection.setRange({date_from: $('#date_from').val(), date_to: $('#date_to').val()});
            this.appointmentsCollection.fetch({
                reset: true,
                data: { 
                    from: this.appointmentsCollection.date_from,
                    to: this.appointmentsCollection.date_to,
                    page: this.appointmentsCollection.page,
                    page_size: this.appointmentsCollection.page_size,
                    firstname: $('#firstname_filter').val(),
                    lastname: $('#lastname_filter').val()
                },
                success: this.renderAppointments
            });
        },
        updateOnEnter: function(e) {
            if (e.which === 13) {
                //this.reloadAppointments();
                e.currentTarget.blur();
            }
        },
        updateFilterOnEnter: function(e) {
            if ((e.which === 13 && e.currentTarget.id === 'firstname_filter') || (e.which === 13 && e.currentTarget.id === 'lastname_filter')) {
                //this.addAll();
                e.currentTarget.blur();
            }
        },
        dayClicked: function() {
            $('#date_from').val(moment().format("YYYY-MM-DD"));
            $('#date_to').val(moment().add(1,'d').format("YYYY-MM-DD"));
            this.reloadAppointments();
        },
        monthClicked: function(e) {

            console.log(this);
            $('#date_from').val(moment().subtract(1,'M').format("YYYY-MM-DD"));
            $('#date_to').val(moment().add(1,'d').format("YYYY-MM-DD"));
            this.reloadAppointments();
        },
        weekClicked: function() {
            $('#date_from').val(moment().subtract(1,'w').format("YYYY-MM-DD"));
            $('#date_to').val(moment().add(1,'d').format("YYYY-MM-DD"));
            this.reloadAppointments();
        },
        apptLastPage: function() {
            this.appointmentsCollection.lastPage();
            this.appointmentsCollection.fetch({reset: true});
        },
        apptNextPage: function() {
            this.appointmentsCollection.nextPage();
            this.appointmentsCollection.fetch({reset: true});
        },
        sortAppointments: function(e) {
            
            if (e.currentTarget.id === this.sortedBy && !this.descending) {
                this.descending = true;
                //console.log('descending')
            } else {
                this.descending = false;
            }
            
            var sortedBy = e.currentTarget.id;
            var multiple;
            
            if (this.descending) {
                this.multiple = -1;
            } else {
                this.multiple = 1;
            }
            
            this.appointmentsCollection.comparator = function(appointment_a, appointment_b) {
                
                if (!this.descending) {
                    
                    if (e.currentTarget.id === 'firstname') {
                        return [ (appointment_a.get('firstname').toLowerCase() > appointment_b.get('firstname').toLowerCase()) ? multiple : -multiple ];
                    } else if (e.currentTarget.id === 'lastname') {
                        return [ (appointment_a.get('lastname').toLowerCase() > appointment_b.get('lastname').toLowerCase()) ? multiple : -multiple ];
                    } else if (e.currentTarget.id === 'signedin_at') {
                        var signin_a = moment(appointment_a.get('start_datetime'), "DD-MMMM-YYYY hh:mmA").unix();
                        var signin_b = moment(appointment_b.get('start_datetime'), "DD-MMMM-YYYY hh:mmA").unix()
                        return [ (signin_a > signin_b) ? multiple : -multiple ];
                    } else if (e.currentTarget.id === 'signedout_at') {
                        var signout_a = appointment_a.get('end_datetime') ? moment(appointment_a.get('end_datetime'), "DD-MMMM-YYYY hh:mmA").unix() : 0;
                        var signout_b = appointment_b.get('end_datetime') ? moment(appointment_b.get('end_datetime'), "DD-MMMM-YYYY hh:mmA").unix() : 0;
                        return [ (signout_a > signout_b) ? multiple : -multiple ];
                        //return [ end_datetime === "" ? end_datetime : moment(end_datetime, "DD-MMMM-YYYY hh:mmA").unix()];
                    }
                    
                }
            }

            this.appointmentsCollection.sort();
            
        },
        closeAll: function() {
           //console.log('closeAll called on appointmentsappview');
            this.trigger('close:all');
            this.unbind();
            this.appointmentsCollection.unbind('reset', this.addAll);
            this.appointmentsCollection.unbind('sort', this.reloadAppointments);
            this.appointmentsCollection = null;
            this.staffCollection = null;
            $('#appointments-table').remove();
            this.remove();
        }
    });

    return new AppointmentsAppView(el);

}

//var appointmentsCollection = new AppointmentsCollection([], {date_from: moment().subtract(1,"M").format("YYYY-MM-DD"), date_to: moment().format("YYYY-MM-DD")});
//var appointmentsCollection = new AppointmentsCollection([], {date_from: $('#date_from'), date_to: $('#date_to')});
//var appointmentsCollection = undefined;

/*
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
