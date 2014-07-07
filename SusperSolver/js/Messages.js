; (function ($) {

    function MessageModel() {

        var self = this;
        self.TotalFeedbacks = ko.observable('');
        self.Feedbacks = ko.observableArray();
        self.SelectedFeedback = ko.observable();
        self.MessageCount = ko.observable('');
        self.FeedbackMessages = ko.observableArray();
        self.Message = ko.observable();
        self.MailToLink1 = ko.observable('');
        self.MailToLink2 = ko.observable('');
    }

    var Loader = SuperSolver.Loader,
        MainModel = new MessageModel(),
        PageCls = '.Page';

    SuperSolver.MessageMain = function () {

        function Init() {

            ko.applyBindings(MainModel);
            LoadFeedbacks();
            HandleFeedbackSelection();
            HandleMessageSelection();
            HandlePrevNext();
            HandleRefresh();
            HandleDelete();
        }

        function LoadFeedbacks() {

            Loader.Show();

            $.get(SuperSolver.API + '/Feedbacks', function (resp) {

                if (resp.Success) {

                    var results = resp.Results;

                    MainModel.TotalFeedbacks(results.length);
                    MainModel.Feedbacks(results);
                } else {
                    navigator.notification.alert(resp.Msg,null,"SuperSolver");
                }
            }).complete(function () {
                Loader.Hide();
            });
        }

        function HandleFeedbackSelection() {

            $('.FeedbackList').on('click', '.ResultRow', function (evt) {

                var target = evt.target,
                parent = $(target).parents('.ResultRow')[0],
                idx = $('.Idx', parent).val();

                SelectFeedback(idx);
            });
        }

        function SelectFeedback(idx) {

            var fb = MainModel.Feedbacks()[idx];
            MainModel.SelectedFeedback(fb);

            LoadMessages();
        }

        function LoadMessages() {

            var fb = MainModel.SelectedFeedback();

            Loader.Show();

            $.get(SuperSolver.API + '/FeedbackMessages?ID=' + fb.SubmittedFeedbackID, function (resp) {

                if (resp.Success) {

                    var results = resp.Results,
                    email = String.format(SuperSolver.ReplyToEmailTmpl, fb.SubmittedFeedbackID);

                    MainModel.MessageCount(results.length);
                    MainModel.FeedbackMessages(results);

                    MainModel.MailToLink1(String.format('mailto:{0}?Subject={1}', email, escape(results[0].Subject)));

                    if (MainModel.MessageCount() == 1) {
                        SelectMessage(0);
                    } else {
                        ShowPage("FeedbackMessages");
                    }
                } else {
                    navigator.notification.alert(resp.Msg,null,"SuperSolver");
                }
            }).complete(function () {
                Loader.Hide();
            });
        }

        function HandleMessageSelection() {

            $('.FeedbackMessageList').on('click', '.ResultRow', function (evt) {

                var target = evt.target,
                parent = $(target).parents('.ResultRow')[0],
                idx = $('.Idx', parent).val();

                SelectMessage(idx);
            });
        }

        function SelectMessage(idx) {

            var msg = MainModel.FeedbackMessages()[idx];

            Loader.Show();

            $.get(SuperSolver.API + '/Message?ID=' + msg.MessageID, function (resp) {

                if (resp.Success) {

                    var fullMsg = resp.Message,
                    email = String.format(SuperSolver.ReplyToEmailTmpl, fullMsg.SubmittedFeedbackID);

                    MainModel.Message(fullMsg);
                    MainModel.MailToLink2(String.format('mailto:{0}?Subject={1}', email, escape(fullMsg.Subject)));

                    ShowPage("MessageView");
                } else {
                    navigator.notification.alert(resp.Msg,null,"SuperSolver");
                }
            }).complete(function () {
                Loader.Hide();
            });
        }

        function ShowPage(page) {

            $('html,body').animate({
                scrollTop: 0},
            'fast');

            $(PageCls).hide();
            $('.Page[data-page="' + page + '"]').show();
        }

        function HandlePrevNext() {

            $('.PrevBtn', '.Page[data-page="FeedbackMessages"]').click(function () {
                ShowPage('Feedbacks');
            });

            $('.PrevBtn', '.Page[data-page="MessageView"]').click(function () {
                if (MainModel.MessageCount() == 1) {
                    ShowPage('Feedbacks');
                } else {
                    ShowPage('FeedbackMessages');
                }
            });
        }

        function HandleRefresh() {

            $('.RefreshBtn', '.Page[data-page="Feedbacks"]').click(function () {
                LoadFeedbacks();
            });

            $('.RefreshBtn', '.Page[data-page="FeedbackMessages"]').click(function () {
                LoadMessages();
            });
        }

        function HandleDelete() {

            $('.DeleteBtn', '.Page[data-page="MessageView"]').click(function () {

                navigator.notification.confirm('Are you sure you would like to delete this message?',
                                                    ExecDelete,
                                                    "SuperSolver");
            });
        }
            
         function ExecDelete(buttonIndex){
                
             if (buttonIndex !== 1) {
                 return;
             }
             
             var msg = MainModel.Message();

                $.post(SuperSolver.API + '/DeleteMessage', { ID: msg.MessageID }, function (resp) {

                    if (resp.Success) {

                        setTimeout(function () {
                            LoadFeedbacks();
                            ShowPage('Feedbacks');
                        }, 300);
                    } else {
                        navigator.notification.alert(resp.Msg,null,"SuperSolver");
                    }
                }).complete(function () {
                    Loader.Hide();
                });
        }

        return {
            Init: function () {
                Init();
            }
        };
    } ();

})(jQuery);
