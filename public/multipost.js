$(document).ready(function() {
    $(document).delegate('.menu-btn', 'click', function(event){
        $('body .menu').toggleClass('expand');
        event.stopPropagation();
        $(document).delegate('body', 'click', function(event){
            $('body .menu').removeClass('expand');
            event.stopPropagation();
        });
    });

    // $(document).delegate('.post-container', 'click', function(event){
    //     event.preventDefault();
    //     $(location).attr('href',"/single-post/");
    //     event.stopPropagation();
    // });
});