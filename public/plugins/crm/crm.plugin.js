/**
 * Created by paulex on 10/25/17.
 */

//lets first of all create our element that will load the div
$(function () {
    //preset resources
    var base_url = "http://localhost:9003";
    var styleLink = `${base_url}/plugins/crm/crm.plugin.css`;
    var contentLink = `${base_url}/plugins/crm/crm.plugin.html`;

    var dataTables = `${base_url}/ext_plugin/datatables/jquery.dataTables.min.js`;
    var bootstrapDataTables = `${base_url}/ext_plugin/datatables/dataTables.bootstrap4.min.js`;


    var crmDataEl = $('#mrworking-crm-data');
    var relationName, relationId;

    /*
     * Initialization
     * Check if DataTables has already been installed on the page
     * Add our custom StyleSheet to the page
     **/
    $('head').append(`<link rel="stylesheet" href=${styleLink}>`);
    var body = $('body');
    body.append('<div id="mrworking-crm"></div>');


    if (!jQuery().DataTable) {
        //Import DataTables
        addScripts(dataTables, [bootstrapDataTables], ()=>validatePage())
    } else {
        validatePage();
    }

    /*
     * we'd need to check if the mrworking-data element is set
     * Also checking for necessary attributes that are required
     * **/
    function validatePage() {
        if (!crmDataEl.length) {
            //throw an error this page cannot continue
            throw new ReferenceError("cannot find element with id: 'mrworking-crm-data'");
        } else {
            //check that the required attribute are init
            relationName = crmDataEl.attr('data-relation-name');
            relationId = crmDataEl.attr('data-relation-id');
            if ((relationName == false || relationName == undefined) || (relationId == false || relationId == undefined)) {
                throw new ReferenceError("The data-relation-name and data-relation-id attribute must be set");
            }
        }
        $('#mrworking-crm').load(contentLink, function (res, status) {
            $('.agetron').click(function () {
                jQuery('#modal-top').modal('show');
            });
            if (status == 'success')  render()
        });
    }


    /**
     *
     */
    function render() {
        /*
         * Load and Render the HTML source file of the crm plugin here
         * Register all event after page has been loaded
         **/
        var dialogH3 = $("#mrworking-relation-title");
        (dialogH3 != null && dialogH3 != undefined) ? dialogH3.text(`${relationName.toUpperCase()} : ${relationId}`)
            : console.log("can't find dialog title element");

        var detailsPage = $(".mrworking-crm-details");
        var listPage = $(".mrworking-crm-list");
        detailsPage.fadeOut();

        var table = $('.mrworking-datatable').DataTable({
            destroy: true,
            "language": {
                "search": "",
                "searchPlaceholder": "Enter Search Word",
                "lengthMenu": "Show _MENU_"
            },
            // 'ajax': {
            //     url: "http://localhost:9003/work_orders/customer/000000001"
            // },
            drawCallback: function () {
                //remove loading notification
                $("#mrworking-crm-loading").remove();

                $('.mrworking-work-order-no').click(function(){
                    listPage.fadeOut('slow', function(){
                        detailsPage.fadeIn();
                    });
                });
            }
        });


        //Details Page Events
        $('.mrworking-crm-tabgroup > div').hide();
        $('.mrworking-crm-tabgroup > div:first-of-type').show();

        $('.mrworking-crm-tabs a').click(function(e){
            e.preventDefault();
            var aLink = $(this);
            var otherLinks = aLink.closest('li').siblings().children('a');
            //remove active class from all others and add active to this
            aLink.addClass('active');
            otherLinks.removeClass('active');

            var tabGroup = $("#mrworking-first-group");
            var target = aLink.attr('href');
            tabGroup.children('div').hide();
            $(target).show();
        });

        //Register back button event
        $('.back-btn').click(function(){
            $(".mrworking-crm-details").fadeOut('fast', function(){
                $(".mrworking-crm-list").fadeIn();
            });
        });
    }
});

function addScripts(initial, scripts, callback, currentIndex = 0) {
    $.getScript(initial, function () {
        if (!scripts.length || (scripts.length - currentIndex == 0)) return callback();
        addScripts(scripts[currentIndex], scripts, callback, ++currentIndex);
    });
}