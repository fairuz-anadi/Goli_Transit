<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * Vercel (and the Render load balancer) terminate TLS and forward the
     * original scheme in X-Forwarded-Proto. Without trusting them, every
     * request looks plain HTTP, so asset() and url() emit http:// links on an
     * https:// page - the browser then blocks the JS/CSS as mixed content and
     * the app renders a blank screen.
     *
     * '*' is the right value here because the platform assigns proxy IPs
     * dynamically and the app is never reachable except through that proxy.
     *
     * @var array<int, string>|string|null
     */
    protected $proxies = '*';

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB;
}
