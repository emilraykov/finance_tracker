<?php


namespace controller;


use exceptions\BadRequestException;
use exceptions\ForbiddenException;
use exceptions\MethodNotAllowedException;
use interfaces\Deletable;
use model\accounts\AccountDAO;
use model\categories\CategoryDAO;
use model\transactions\Transaction;
use model\transactions\TransactionDAO;

class TransactionController implements Deletable {
    public function add() {
        if (isset($_POST['add_transaction'])) {
            if (!isset($_POST["account_id"]) || empty($_POST["account_id"])) {
                throw new BadRequestException("Account is required!");
            } elseif (!isset($_POST["category_id"]) || empty($_POST["category_id"])) {
                throw new BadRequestException("Category is required!");
            } elseif (!isset($_POST["amount"]) || !Validator::validateAmount($_POST["amount"])) {
                throw new BadRequestException("Amount must be between 0 and " . MAX_AMOUNT . " inclusive!");
            } elseif (!isset($_POST["time_event"]) || !Validator::validateDate($_POST["time_event"])) {
                throw new BadRequestException("Please select valid day!");
            } elseif (!isset($_POST["note"]) || !Validator::validateName($_POST["note"])) {
                throw new BadRequestException("Name must be have between " . MIN_LENGTH_NAME . " and ". MAX_LENGTH_NAME . " symbols inclusive!");
            } elseif (!isset($_POST["currency"]) || !Validator::validateCurrency($_POST["currency"])) {
                throw new BadRequestException(MSG_SUPPORTED_CURRENCIES);
            }

            $accountDAO = new AccountDAO();
            $categoryDAO = new CategoryDAO();
            $account = $accountDAO->getAccountById($_POST['account_id']);
            $category = $categoryDAO->getCategoryById($_POST['category_id'], $account->getOwnerId());

            if (!$account || $account->getOwnerId() != $_SESSION['logged_user']) {
                throw new BadRequestException("No such account.");
            } elseif (!$category) {
                throw new BadRequestException("No such category.");
            }

            $transaction = new Transaction($_POST['amount'], $account, strtoupper($_POST['currency']), $category, $_POST['note'], $_POST['time_event']);
            $transactionDAO = new TransactionDAO();
            $transactionDAO->create($transaction);
            return new ResponseBody('Transaction added successfully!', $transaction);
        }
        throw new MethodNotAllowedException("Method not allowed!");
    }

    public function showUserTransactions() {
        if ($_SERVER["REQUEST_METHOD"] == "GET") {
            $from_date = null;
            $to_date = null;
            if (isset($_GET["date_range"]) && !empty($_GET['date_range'])) {
                $date_range = explode(" - ", $_GET['date_range']);
                if (count($date_range) != 2) {
                    throw new BadRequestException("Please select valid date_range.");
                }
                $from_date = date_format(date_create($date_range[0]), "Y-m-d");
                $to_date = date_format(date_create($date_range[1]), "Y-m-d");
            }
            $category_id = isset($_GET["category_id"]) && Validator::validateCategoryType($_GET["category_id"]) ? $_GET["category_id"] : null;
            $transactionDAO = new TransactionDAO();
            $transactions = $transactionDAO->getByUserAndCategory($_SESSION['logged_user'], $category_id, $from_date, $to_date);
            return new ResponseBody(null, $transactions);
        }
        throw new MethodNotAllowedException("Method not allowed!");
    }

    public function delete() {
        if ($_POST["delete"]) {
            if (!isset($_POST["transaction_id"]) || empty($_POST['transaction_id'])) {
                throw new BadRequestException("Bad request!");
            }
            $transactionDAO = new TransactionDAO();
            $transaction = $transactionDAO->getTransactionById($_POST["transaction_id"]);
            $transferController = new TransferController();

            if ($transferController->checkTransactionType($transaction) !== false) {
                throw new BadRequestException("Transfers can not be deleted!");
            }

            if (!$transaction || $transaction->getAccount()->getOwnerId() != $_SESSION['logged_user']) {
                throw new ForbiddenException("This transaction is not yours!");
            }
            $transactionDAO->deleteTransaction($transaction);
            return new ResponseBody('Deleted successfully!', $transaction);
        }
        throw new MethodNotAllowedException("Method not allowed!");
    }
}