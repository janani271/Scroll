$(document).ready(function() {
    $(document).delegate('.menu-btn', 'click', function(event){
        $('body .menu').toggleClass('expand');
        event.stopPropagation();
        $(document).delegate('body', 'click', function(event){
            $('body .menu').removeClass('expand');
            event.stopPropagation();
        });
    });
});