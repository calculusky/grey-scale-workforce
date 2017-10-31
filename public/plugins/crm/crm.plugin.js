/**
 * Created by paulex on 10/25/17.
 */

//lets first of all create our element that will load the div
$(function () {
    //preset resources
    var base_url = "http://85.25.103.81:9003";
    var styleSheets = [`${base_url}/plugins/crm/crm.plugin.css`];
    var contentLink = `${base_url}/plugins/crm/crm.plugin.html`;

    var codeBase = 'http://85.25.103.81/mrworking-web/public/js/codebase.min.js';
    var dataTables = `http://85.25.103.81/mrworking-web/public/js/plugins/datatables/jquery.dataTables.min.js`;
    var bootstrapDataTables = `http://85.25.103.81/mrworking-web/public/js/plugins/datatables/dataTables.bootstrap4.min.js`;


    var crmDataEl = $('.mrworking-crm-data');
    var relationName, relationId;

    /*
     * Initialization
     * Check if DataTables has already been installed on the page
     * Add our custom StyleSheet to the page
     **/
    for (var i = 0; i < styleSheets.length; i++) {
        $('head').append(`<link rel="stylesheet" href=${styleSheets[i]}>`);
    }
    var body = $('body');
    body.append('<div id="mrworking-crm"></div>');


    if (!jQuery().DataTable) {
        //Import DataTables
        addScripts(codeBase, [dataTables, bootstrapDataTables], ()=>validatePage())
    } else {
        validatePage();
    }

    /*
     * we'd need to check if the mrworking-data element is set
     * Also checking for necessary attributes that are required
     * **/
    function validatePage() {
        jQuery(function () {
            Codebase.helpers(['ckeditor', 'content-filter']);
        });
        if (!crmDataEl.length) {
            //throw an error this page cannot continue
            throw new ReferenceError("cannot find element with id: 'mrworking-crm-data'");
        } else {
            //check that the required attribute are init
            relationName = crmDataEl.attr('data-relation-name');
            relationId = crmDataEl.attr('data-relation-id');
            if ((relationName == false || relationName == undefined)
                || (relationId == false || relationId == undefined)) {
                throw new ReferenceError("The data-relation-name and data-relation-id attribute must be set");
            }
        }
        $('#mrworking-crm').load(contentLink, function (res, status) {
            $('.mrworking-crm-container').css('visibility', 'visible');
            $('.mrworking-crm-data').click(function () {
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
        var workOrders = [];
        var table = $('.mrworking-datatable').DataTable({
            destroy: true,
            "language": {
                "search": "",
                "searchPlaceholder": "Enter Search Word",
                "lengthMenu": "Show _MENU_"
            },
            'ajax': {
                url: `${base_url}/work_orders/customer/${relationId}`,
                dataFilter: function (data) {
                    var json = jQuery.parseJSON(data);
                    var records = {};
                    if (json && json.status == 'success') {
                        //get the items
                        workOrders = json.data.items;
                        records.recordsTotal = json.data.items.length;
                        records.recordsFiltered = json.data.items.length;
                        records.data = [];
                        for (var i = 0; i < records.recordsTotal; i++) {
                            var item = json.data.items[i];
                            var holder = [];
                            holder.push(
                                item['work_order_no'],
                                '--',
                                item['type_name'],
                                item['status'],
                                item['disconnection']['min_amount_payable'],
                                item['contact_name'],
                                item['start_date'],
                            );
                            records.data.push(holder);
                        }
                    }
                    return JSON.stringify(records);
                }
            },
            "rowCallback": function (row, data, index) {
                $('td:eq(0)', row).html(`<a data-work-order='${JSON.stringify(workOrders[index])}' href="#" class="ellipsis-wrap mrworking-work-order-no">${data[0]}</a>`);
                var st = data[3];
                $('td:eq(3)', row).html(`<span class="badge ${getStatusClass(st)}">${getStatusName(st)}</span>`);
                $('td:eq(2)', row).html(`<span style="font-size: 11px" class="ellipsis-wrap">${data[2].toUpperCase()}</span>`);
                $('td:eq(4)', row).html(`<span class="ellipsis-wrap">₦ ${parseFloat(data[4]).toLocaleString()}</span>`);
                if (data[6]) {
                    var date = new Date(data[6]);
                    $('td:eq(6)', row).html(`<span class="ellipsis-wrap">${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}</span>`);
                } else {
                    $('td:eq(6)', row).text('Not Specified');
                }
            },
            "drawCallback": function () {
                //remove loading notification
                $("#mrworking-crm-loading").remove();

                $('.mrworking-work-order-no').click(function () {
                    var $a = $(this);
                    listPage.fadeOut('slow', function () {
                        let workOrder = JSON.parse($a.attr('data-work-order'));
                        fetchWorkOrderDetails(workOrder.work_order_no);
                        fetchWorkOrderNotes(workOrder.id);
                        doDetailsPage(workOrder);
                        //we should fetch an updated record here
                        detailsPage.fadeIn();
                    });
                });
            }
        });


        //Details Page Events
        $('.mrworking-crm-tabgroup > div').hide();
        $('.mrworking-crm-tabgroup > div:first-of-type').show();

        $('.mrworking-crm-tabs a').click(function (e) {
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

        function fetchWorkOrderDetails(workOrderNo) {
            $.ajax(`${base_url}/work_orders/${workOrderNo}`)
                .done(function (data) {
                    if (data.status != 'success') return;
                    doDetailsPage(data.data.items[0]);
                })
                .fail(function (err) {
                    console.log(err);
                });
        }

        function fetchWorkOrderNotes(workOrderNo) {
            $.ajax(`${base_url}/work_orders/${workOrderNo}/notes/0/1000`)
                .done(function (data) {
                    if (data.status != 'success') return;
                    let notes = data.data.items;
                    doNotesPage(notes);
                })
                .fail(function (err) {
                    console.log(err);
                });
        }

        function doDetailsPage(workOrder) {
            $('#mrworking-details-w-no').text(`Disconnection Order Details - ${workOrder.work_order_no}`);
            $('#mrworking-details-cust-no').text(workOrder.relation_id);
            $('#mrworking-details-cust-name').text(workOrder.relation_name);
            $('#mrworking-details-priority').text(getPriority(workOrder.priority));
            $('#mrworking-details-status')
                .html(`<span class="badge ${getStatusClass(workOrder.status)}">${getStatusName(workOrder.status)}</span>`);

            $('#mrworking-details-assigned-to').text('Not Available');

            $('#mrworking-details-issue-date').text((workOrder.issue_date) ?
                workOrder.issue_date.replace('T', ' ').replace('.000Z', '') : "--");

            $('#mrworking-details-start-date').text((workOrder.start_date) ?
                workOrder.start_date.replace('T', ' ').replace('.000Z', '') : "--");

            $('#mrworking-details-comp-date').text((workOrder.completed_date) ?
                workOrder.completed_date.replace('T', ' ').replace('.000Z', '') : "--");

            $('#mrworking-details-date-created').text(workOrder.created_at.replace('T', ' ').replace('.000Z', ''));
            $('#mrworking-details-group').text(workOrder.group.name);
            $('#mrworking-details-summary').text(workOrder.summary);

            $('#mrworking-details-current-bill')
                .text(`₦ ${parseInt(workOrder.disconnection.current_bill).toLocaleString()}`);

            $('#mrworking-details-net-arrears')
                .text(`₦ ${parseInt(workOrder.disconnection.arrears).toLocaleString()}`);

            $('#mrworking-details-min-amount')
                .text(`₦ ${parseInt(workOrder.disconnection.min_amount_payable).toLocaleString()}`);

            $('#mrworking-details-reconnection-fee')
                .text(`₦ ${parseInt(workOrder.disconnection.reconnection_fee)}`);

            $('#mrworking-details-total-amount')
                .text(`₦ ${parseInt(workOrder.disconnection.total_amount_payable).toLocaleString()}`);

            $('#mrworking-details-contact-name').text(workOrder.contact_name);
            $('#mrworking-details-contact-phone').text(workOrder.contact_phone);
            $('#mrworking-details-contact-email').text(workOrder.contact_email);

            $('#mrworking-notes-order-no').text(`Notes- ${workOrder.work_order_no}`);
        }

        function doNotesPage(notes) {
            let noteContentDiv = $('.note-content');
            noteContentDiv.empty();
            for (var i = 0; i < notes.length; i++) {
                let note = notes[i];
                noteContentDiv
                    .append('<tr>' +
                        '<td class="d-none d-sm-table-cell text-center" style="width: 40px; padding: 14px 8px 14px 2px">' +
                        '<div class="mb-10">' +
                        '<a href="javascript:;">' +
                        '<img class="img-avatar" src="http://85.25.103.81/mrworking-web/public/img/avatars/avatar0.jpg" alt="">' +
                        '</a>' +
                        '</div>' +
                        '<small style="font-weight: bold; line-height:2.5">' +
                        note.user.first_name + ' ' + note.user.last_name +
                        '</small>' +
                        '</td>' +
                        '<td style="vertical-align: middle;">' +
                        '<p style="margin-bottom: 0;">' + note.note + '</p><hr>' +
                        '</td>' +
                        '</tr>')
            }
        }

        //Register back button event
        $('.back-btn').click(function () {
            $(".mrworking-crm-details").fadeOut('fast', function () {
                $(".mrworking-crm-list").fadeIn();
            });
        });
    }
});
function getStatusClass(status) {
    switch (status) {
        case 1:
            return "color-status-new";
        case 2:
            return "color-status-assigned";
        case 3:
            return "color-status-disconnected";
        case 4:
            return "color-status-escalated";
        case 5:
            return "color-status-paid";
        case 6:
            return "color-status-closed";
    }
}

function getStatusName(status) {
    switch (status) {
        case 1:
            return "New";
        case 2:
            return "Assigned";
        case 3:
            return "Disconnected";
        case 4:
            return "Escalated";
        case 5:
            return "Payment Received";
        case 6:
            return "Closed";
    }
}

function getPriority(priority) {
    switch (priority) {
        case "0":
            return "Low";
        case "1":
            return "Medium";
        case "2":
            return "High";
        case "3":
            return "Urgent";
    }
}

function addScripts(initial, scripts, callback, currentIndex = 0) {
    $.getScript(initial, function () {
        if (!scripts.length || (scripts.length - currentIndex == 0)) return callback();
        addScripts(scripts[currentIndex], scripts, callback, ++currentIndex);
    });
}