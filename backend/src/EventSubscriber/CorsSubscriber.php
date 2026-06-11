<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class CorsSubscriber implements EventSubscriberInterface
{
    private const ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    private const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
    private const ALLOWED_HEADERS = 'Content-Type, Authorization';

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 2048],
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if (!$this->isApiRequest($request->getPathInfo()) || $request->getMethod() !== 'OPTIONS') {
            return;
        }

        $response = new Response('', Response::HTTP_NO_CONTENT);
        $this->addCorsHeaders($response, $request->headers->get('Origin'));

        $event->setResponse($response);
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();

        if (!$this->isApiRequest($request->getPathInfo())) {
            return;
        }

        $this->addCorsHeaders($event->getResponse(), $request->headers->get('Origin'));
    }

    private function addCorsHeaders(Response $response, ?string $origin): void
    {
        if ($origin === null || !in_array($origin, self::ALLOWED_ORIGINS, true)) {
            return;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', self::ALLOWED_METHODS);
        $response->headers->set('Access-Control-Allow-Headers', self::ALLOWED_HEADERS);
        $response->headers->set('Vary', 'Origin');
    }

    private function isApiRequest(string $path): bool
    {
        return str_starts_with($path, '/api');
    }
}
