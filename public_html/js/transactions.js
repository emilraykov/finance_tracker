let _deleteButtonTransaction = function (event) {
    let trId = $(this).closest("tr").attr("id");
    let transactionNote = $("#" + trId + " .note").text();
    if (confirm("Are you sure you want to delete " + transactionNote + "?")) {
        $.post("app/index.php?target=transaction&action=delete",
            {
                delete : true,
                transaction_id : trId,
            }, function (data) {
                $("#"+trId).fadeOut(1500);
            }, 'json')
            .fail(function (xhr, status, error) {
                if (xhr.status === 401) {
                    localStorage.removeItem("id");
                    localStorage.removeItem("first_name");
                    localStorage.removeItem("last_name");
                    localStorage.removeItem("avatar_url");
                    window.location.replace('login.html');
                } else {
                    showModal(error, xhr.responseJSON.message);
                }
            });
    }
};

function addTransaction() {
    let selectAccount = $("#account");
    $.get("app/index.php?target=account&action=getAll",
        function (response) {
        $.each(response.data, function (key, value) {
            selectAccount.append($("<option />").val(this.id).text(this.name + ' (' + this.current_amount + ' ' + this.currency + ')'));
        })
    }, 'json')
        .fail(function (xhr, status, error) {
            showModal(error, xhr.responseJSON.message);
        });

    let type = $("#type");
    type.on("change", function () {
        let selectCategory = $("#category");
        selectCategory.empty();

        if (this.value == 0 || this.value == 1) {
            $.get("app/index.php?target=category&action=getAll",
                {
                    category_type: this.value,
                }
                , function (data) {
                    $.each(data.data, function (key, value) {
                        selectCategory.append($("<option />").val(value.id).text(value.name));
                    });
                }, 'json')
                .fail(function (xhr, status, error) {
                    showModal(error, xhr.responseJSON.message);
                });
        }
    });
}

function getTransactionsMain(daterange = null) {
    $.get("app/index.php?target=transaction&action=showUserTransactions", {date_range : daterange},
        function (response) {
            let table = $("#transactions");
            table.empty();

            $.each(response.data, function (key, value) {
                let tr = $("<tr />");
                tr.attr("id", value.id);

                let amount = $("<td data-order='" + value.amount +"'></td>");
                amount.text(value.amount);
                amount.append('&nbsp;' + value.currency);
                amount.addClass("font-weight-bold");
                let transactionType = $("<td></td>");
                if (value.category.type == 1) {
                    transactionType.text('Income');
                    amount.addClass("text-success");
                } else {
                    transactionType.text('Outcome');
                    amount.addClass("text-danger");
                }
                let accountName = $("<td></td>");
                accountName.text(value.account.name);
                let categoryName = $("<td></td>");
                categoryName.text(value.category.name);
                let icon = $("<i class='pull-right'></i>");
                icon.addClass(value.category.icon);
                categoryName.append(icon);
                let note = $("<td></td>");
                note.text(value.note);
                note.addClass('note');
                let timeEvent = $("<td></td>");
                timeEvent.text(value.time_event);

                let deleteItem = $("<td></td>");
                if (value.category.name !== 'Transfer') {
                    let deleteItemButton = $("<button>Delete</button>");
                    deleteItemButton.addClass('btn btn-danger');
                    deleteItem.append(deleteItemButton);
                    deleteItemButton.bind("click", _deleteButtonTransaction);
                }

                tr.append(transactionType);
                tr.append(amount);
                tr.append(accountName);
                tr.append(categoryName);
                tr.append(note);
                tr.append(timeEvent);
                tr.append(deleteItem);

                table.append(tr);
            });

        }, 'json')
        .fail(function (xhr, status, error) {
            if (xhr.status === 401) {
                localStorage.removeItem("id");
                localStorage.removeItem("first_name");
                localStorage.removeItem("last_name");
                localStorage.removeItem("avatar_url");
                window.location.replace('login.html');
            }else {
                showModal(error, xhr.responseJSON.message);
            }
        });
}


$(document).ready(function () {
    $("form#addtransaction").on("submit", function (e) {
        e.preventDefault();
        let form = $(this);
        let action = form.attr("action");
        let data = form.serialize() + '&' + $("#submit").attr("name");
        $.post(action, data, function (data) {
            $("#addTransactionModal").modal('hide');
            showModal('Success', data.msg);
            form.trigger("reset");
            $("#category").empty();
            let table = $("#transactions");
            let tr = $("<tr />");
            tr.attr('id', data.data.id);

            let amount = $("<td></td>");
            amount.text(data.data.amount);
            amount.append('&nbsp;' + data.data.currency);
            let transactionType = $("<td></td>");
            if (data.data.category.type == 0) {
                transactionType.text('Outcome');
            } else {
                transactionType.text('Income');
            }
            let accountName = $("<td></td>");
            accountName.text(data.data.account.name);
            let categoryName = $("<td></td>");
            categoryName.text(data.data.category.name);
            let icon = $("<i class='pull-right' />");
            icon.addClass(data.data.category.icon);
            categoryName.append(icon);
            let note = $("<td></td>");
            note.text(data.data.note);
            let timeEvent = $("<td></td>");
            timeEvent.text(data.data.time_event);

            let deleteItem = $("<td></td>");
            if (data.data.category.name !== 'Transfer') {
                let deleteItemButton = $("<button>Delete</button>");
                deleteItemButton.addClass('btn btn-danger');
                deleteItem.append(deleteItemButton);
                deleteItemButton.bind("click", _deleteButtonTransaction);
            }

            tr.append(transactionType);
            tr.append(amount);
            tr.append(accountName);
            tr.append(categoryName);
            tr.append(note);
            tr.append(timeEvent);
            tr.append(deleteItem);

            table.prepend(tr);

        }, 'json')
            .fail(function (xhr, status, error) {
                if (xhr.status === 401) {
                    localStorage.removeItem("id");
                    localStorage.removeItem("first_name");
                    localStorage.removeItem("last_name");
                    localStorage.removeItem("avatar_url");
                    window.location.replace('login.html');
                }else {
                    showModal(error, xhr.responseJSON.message);
                }
            });
    });
});