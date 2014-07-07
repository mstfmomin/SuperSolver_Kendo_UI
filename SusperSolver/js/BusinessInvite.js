; (function ($) {

    var BusinessInvite = function () {

        function Init() {

            $('#btnInviteBusiness').on('click', function (evt) {

                if ($.trim($('#txtBusinessName').val()) == '') {
                    navigator.notification.alert('Please enter Business Name.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#txtBusinessEmail').val()) == '' && $.trim($('#txtBusinessFax').val()) == '') {
                    navigator.notification.alert('Please enter Business E-Mail or Business Fax.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#txtBusinessEmail').val()) != '') {
                    if (isEmail($.trim($('#txtBusinessEmail').val())) == false) {
                        navigator.notification.alert('Please enter a valid Business E-Mail.',null,"SuperSolver");
                        return false;
                    }
                }

                if ($.trim($('#txtCustomerEmail').val()) != '') {
                    if (isEmail($.trim($('#txtCustomerEmail').val())) == false) {
                        navigator.notification.alert('Please enter a valid E-Mail.',null,"SuperSolver");
                        return false;
                    }
                }

                SuperSolver.Loader.Show();

                var params = {
                    BusinessName: $('#txtBusinessName').val(),
                    BusinessEmail: $('#txtBusinessEmail').val(),
                    BusinessFax: $('#txtBusinessFax').val(),
                    CustomerEmail: $('#txtCustomerEmail').val()
                };

                $.post(SuperSolver.theURL + 'InviteBusiness', params, function (data) {
                    SuperSolver.Loader.Hide();

                    if (data.Success == true) {
                        navigator.notification.alert("Thank you for inviting a business to SuperSolver.",
                                                     null,
                                                     "SuperSolver",
                                                     "Ok");
                        window.location.href = "app.html";
                    } else {
                        navigator.notification.alert(data.Msg,null,"SuperSolver");
                    }
                }).complete(function () {

                });
            });
        }

        function isEmail(str) {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(str)) {
                return (true);
            }

            return false;
        }

        return {
            Init: function () {
                Init();
            }
        }
    } ();

    SuperSolver.BusinessInvite = BusinessInvite;

} (jQuery));