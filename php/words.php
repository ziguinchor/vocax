<?php

// Get the Origin header sent by the browser
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'http://localhost:3001',  // your frontend origin(s)
    // add other allowed origins if needed
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // If origin not allowed, you can either block or set a default
    // For safety, just block:
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Origin not allowed']);
    exit;
}

// Always include these when sending credentials
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Basic Auth check
$user = 'oxgen';
$pass = 'oxgen';

if (
    !isset($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'])
    || $_SERVER['PHP_AUTH_USER'] !== $user
    || $_SERVER['PHP_AUTH_PW'] !== $pass
) {

    header('WWW-Authenticate: Basic realm="Restricted Area"');
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// words.php

header('Content-Type: application/json');

$wordsDataFilePath = __DIR__ . '/data/words.json';
$categoriesDataFilePath = __DIR__ . '/data/categories.json'; // New file for categories

// --- Word Functions ---

// Read words from file
function getWords()
{
    global $wordsDataFilePath;
    if (!file_exists($wordsDataFilePath)) {
        return [];
    }
    $data = file_get_contents($wordsDataFilePath);
    return json_decode($data, true) ?: [];
}

// Save words to file
function saveWords(array $words)
{
    global $wordsDataFilePath;
    usort($words, function ($a, $b) {
        return intval($a['id']) <=> intval($b['id']);
    });
    $json = json_encode($words, JSON_PRETTY_PRINT);
    if (file_put_contents($wordsDataFilePath, $json) === false) {
        return ['success' => false, 'message' => 'Error saving words'];
    }
    return ['success' => true, 'message' => 'Words saved successfully'];
}

// --- Category Functions ---

// Read categories from file
function getCategories()
{
    global $categoriesDataFilePath;
    if (!file_exists($categoriesDataFilePath)) {
        return [];
    }
    $data = file_get_contents($categoriesDataFilePath);
    return json_decode($data, true) ?: [];
}

// Save categories to file
function saveCategories(array $categories)
{
    global $categoriesDataFilePath;
    usort($categories, function ($a, $b) {
        return intval($a['id']) <=> intval($b['id']);
    });
    $json = json_encode($categories, JSON_PRETTY_PRINT);
    if (file_put_contents($categoriesDataFilePath, $json) === false) {
        return ['success' => false, 'message' => 'Error saving categories'];
    }
    return ['success' => true, 'message' => 'Categories saved successfully'];
}


// Get raw input and decode JSON
$inputRaw = file_get_contents('php://input');
$input = json_decode($inputRaw, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Handle 3-element array as updateWordStatus (legacy format)
if (is_array($input) && count($input) === 3 && isset($input[0], $input[1], $input[2])) {
    $wordId = $input[0];
    $statusIndex = $input[1];
    $checked = $input[2];

    $words = getWords();
    $found = false;
    foreach ($words as &$word) {
        if ($word['id'] == $wordId) {
            if (!isset($word['statuses'][$statusIndex])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid status index']);
                exit;
            }
            $word['statuses'][$statusIndex] = (bool) $checked;
            $found = true;
            break;
        }
    }
    if (!$found) {
        echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
        exit;
    }
    echo json_encode(saveWords($words));
    exit;
}

// Otherwise expect object with 'action'
if (!isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing action']);
    exit;
}

$action = $input['action'];

switch ($action) {
    case 'getWords':
        echo json_encode(getWords());
        break;

    case 'updateWordStatus':
        $wordId = $input['wordId'] ?? null;
        $statusIndex = $input['statusIndex'] ?? null;
        $checked = $input['checked'] ?? null;
        if ($wordId === null || $statusIndex === null || $checked === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing parameters']);
            exit;
        }
        $words = getWords();
        $found = false;
        foreach ($words as &$word) {
            if ($word['id'] == $wordId) {
                if (!isset($word['statuses'][$statusIndex])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid status index']);
                    exit;
                }
                $word['statuses'][$statusIndex] = (bool) $checked;
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
            exit;
        }
        echo json_encode(saveWords($words));
        break;

    case 'updateWordText':
        $wordId = $input['wordId'] ?? null;
        $newText = $input['newText'] ?? null;
        if ($wordId === null || $newText === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing parameters']);
            exit;
        }
        $words = getWords();
        $found = false;
        foreach ($words as &$word) {
            if ($word['id'] == $wordId) {
                $word['text'] = $newText;
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
            exit;
        }
        echo json_encode(saveWords($words));
        break;

    case 'appendWordText':
        $wordId = $input['wordId'] ?? null;
        $textToAppend = $input['textToAppend'] ?? null;
        if ($wordId === null || $textToAppend === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing parameters']);
            exit;
        }
        $words = getWords();
        $found = false;
        foreach ($words as &$word) {
            if ($word['id'] == $wordId) {
                $word['text'] .= ' -- ' . $textToAppend;
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
            exit;
        }
        echo json_encode(saveWords($words));
        break;

    case 'addWord':
        $text = $input['text'] ?? null;
        if ($text === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing text parameter']);
            exit;
        }
        $words = getWords();
        $ids = array_map(fn($w) => intval($w['id']), $words);
        $newId = (empty($ids) ? 1 : max($ids) + 1);
        $newWord = [
            'id' => (string) $newId,
            'text' => $text,
            'statuses' => [false, false, false, false],
            'categoryIds' => [], // Initialize with empty categories
        ];
        $words[] = $newWord;
        $result = saveWords($words);
        if ($result['success']) {
            $result['word'] = $newWord;
        }
        echo json_encode($result);
        break;

    case 'deleteWord':
        $wordId = $input['wordId'] ?? null;
        if ($wordId === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing wordId parameter']);
            exit;
        }
        $words = getWords();
        $filtered = array_filter($words, fn($w) => $w['id'] != $wordId);
        if (count($filtered) === count($words)) {
            echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
            exit;
        }
        echo json_encode(saveWords(array_values($filtered)));
        break;

    case 'importWords':
        $words = $input['words'] ?? null;
        if (!is_array($words)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid words array']);
            exit;
        }
        echo json_encode(saveWords($words));
        break;

    // --- New Category Actions ---
    case 'getCategories':
        echo json_encode(getCategories());
        break;

    case 'addCategory':
        $name = $input['name'] ?? null;
        $color = $input['color'] ?? null;
        if ($name === null || $color === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing name or color parameter for addCategory']);
            exit;
        }
        $categories = getCategories();
        $ids = array_map(fn($c) => intval($c['id']), $categories);
        $newId = (empty($ids) ? 1 : max($ids) + 1);
        $newCategory = [
            'id' => (string) $newId,
            'name' => $name,
            'color' => $color,
        ];
        $categories[] = $newCategory;
        $result = saveCategories($categories);
        if ($result['success']) {
            $result['category'] = $newCategory;
        }
        echo json_encode($result);
        break;

    case 'updateCategory':
        $id = $input['id'] ?? null;
        $name = $input['name'] ?? null;
        $color = $input['color'] ?? null;
        if ($id === null || $name === null || $color === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing parameters for updateCategory']);
            exit;
        }
        $categories = getCategories();
        $found = false;
        foreach ($categories as &$category) {
            if ($category['id'] == $id) {
                $category['name'] = $name;
                $category['color'] = $color;
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => "Category with ID $id not found"]);
            exit;
        }
        echo json_encode(saveCategories($categories));
        break;

    case 'deleteCategory':
        $id = $input['id'] ?? null;
        if ($id === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing id parameter for deleteCategory']);
            exit;
        }
        $categories = getCategories();
        $filteredCategories = array_filter($categories, fn($c) => $c['id'] != $id);
        if (count($filteredCategories) === count($categories)) {
            echo json_encode(['success' => false, 'message' => "Category with ID $id not found"]);
            exit;
        }
        $result = saveCategories(array_values($filteredCategories));

        // Also remove this category ID from all words
        $words = getWords();
        $wordsModified = false;
        foreach ($words as &$word) {
            if (isset($word['categoryIds']) && is_array($word['categoryIds'])) {
                $initialCount = count($word['categoryIds']);
                $word['categoryIds'] = array_values(array_filter($word['categoryIds'], fn($catId) => $catId != $id));
                if (count($word['categoryIds']) !== $initialCount) {
                    $wordsModified = true;
                }
            }
        }
        if ($wordsModified) {
            saveWords($words); // Save words if any were modified
        }

        echo json_encode($result);
        break;

    case 'updateWordCategories':
        $wordId = $input['wordId'] ?? null;
        $categoryIds = $input['categoryIds'] ?? null;
        if ($wordId === null || !is_array($categoryIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing wordId or invalid categoryIds parameter']);
            exit;
        }
        $words = getWords();
        $found = false;
        foreach ($words as &$word) {
            if ($word['id'] == $wordId) {
                $word['categoryIds'] = $categoryIds;
                $found = true;
                break;
            }
        }
        if (!$found) {
            echo json_encode(['success' => false, 'message' => "Word with ID $wordId not found"]);
            exit;
        }
        echo json_encode(saveWords($words));
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        break;
}
