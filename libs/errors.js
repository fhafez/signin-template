var ErrorsView = Backbone.View.extend({
    id: 'errordiv',
    tagName: 'div',
    className: "errordivshow",
    initialize: function() {
        //this.$el.style.display = 'none';
    },
    events: {
        'click': 'acknowledge',
    },
    show: function(message, error, redirect_to) {
        this.$el.removeClass('errordivhide');
        if (error) {
            //this.$el.html(message + '<p style="font-size:20px; color:#47476B; cursor: pointer; align: center;">OK');
            this.$el.html(message + '<p>&nbsp;<p><label style="font-size:20px; color:#47476B; background-color: white; cursor: pointer; align: center; border: 1px solid gray; border-radius:5px; width:100px; padding:10px;">OK</label>');
            this.$el.addClass('errordivshow');
        } else {
            //this.$el.html(message + '<p style="font-size:20px; color:white; cursor: pointer; align: center;">OK');
            this.$el.html(message + '<p>&nbsp;<p><label style="font-size:20px; color:#47476B; background-color: white; cursor: pointer; align: center; border: 1px solid gray; border-radius:5px; width:100px; padding:10px;">OK</label>');
            this.$el.addClass('successdivshow');
        }
        this.$el.redirect_to = redirect_to;
    },
    acknowledge: function () {
        // console.log(this.$el.redirect_to);

        this.$el.html('');
        this.$el.removeClass('errordivshow');
        this.$el.removeClass('successdivshow');
        this.$el.addClass('errordivhide');

        if (this.$el.redirect_to) {
            document.location = this.$el.redirect_to;
        }
    },
    render: function() {
        return this;
    }
});

var errorsdialog = new ErrorsView({el: '#errordiv'});
errorsdialog.render();

$('#errordiv').html(errorsdialog.$el);