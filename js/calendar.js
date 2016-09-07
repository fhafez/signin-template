var CalAppView = Backbone.View.extend({
    
    initialize: function() {
                
        console.log('calappview init');
            $('#calendar').fullCalendar({
                editable: true,
                events: [
                {
					title: 'Jerome Wong',
					start: '2016-03-28T10:30:00',
					end: '2016-03-28T12:30:00'
				},
                {
					title: 'Elaina Marshal',
					start: '2016-04-20T10:30:00',
					end: '2016-04-20T12:30:00'
				},
                {
					title: 'Kristie',
					start: '2016-04-18T10:30:00',
					end: '2016-04-18T12:30:00'
				},
                {
					title: 'Lisa',
					start: '2016-04-08T10:30:00',
					end: '2016-04-08T12:30:00'
				},
                {
					title: 'Elizabeth',
					start: '2016-04-20T11:30:00',
					end: '2016-04-20T12:30:00'
				},
                {
					title: 'Kaitlin',
					start: '2016-04-18T14:30:00',
					end: '2016-04-18T15:30:00'
				},
                ]
            });
                
        
    }
    
    
});