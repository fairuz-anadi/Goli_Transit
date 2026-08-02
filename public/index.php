<?php

/*
|--------------------------------------------------------------------------
| Front Controller (Apache / artisan serve / Docker)
|--------------------------------------------------------------------------
|
| The boot logic lives in bootstrap/http-entry.php so the Vercel serverless
| function (api/index.php) can reuse it without depending on this file. See
| that file for why the split exists.
|
*/

require __DIR__.'/../bootstrap/http-entry.php';
