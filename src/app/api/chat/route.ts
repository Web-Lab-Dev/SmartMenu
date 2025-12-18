// ========================================
// AI Chat API Route
// ========================================
// Edge function for AI-powered restaurant concierge

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { ProductService } from '@/services/ProductService';
import { formatMenuForAI, buildSystemPrompt } from '@/lib/ai-helpers';

// Enable Edge Runtime for optimal streaming performance
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, restaurantId } = await req.json();

    // Validation
    if (!restaurantId || typeof restaurantId !== 'string') {
      return new Response('Missing or invalid restaurantId', { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Missing or invalid messages', { status: 400 });
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured',
          message:
            'Please add your OpenAI API key to .env.local and restart the server.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch menu from Firestore
    console.log(`[AI Chat] Fetching menu for restaurant: ${restaurantId}`);
    const products = await ProductService.getRestaurantProducts(restaurantId);

    if (products.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No menu available',
          message:
            'Désolé, aucun menu n\'est disponible pour ce restaurant actuellement.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Format menu for AI context
    const menuJson = formatMenuForAI(products);
    const restaurantName = 'Restaurant Demo'; // TODO: Fetch from Firestore when restaurants collection is ready

    // Build system prompt with menu context
    const systemPrompt = buildSystemPrompt(restaurantName, menuJson);

    console.log(`[AI Chat] Processing ${messages.length} messages`);
    console.log(`[AI Chat] Menu items: ${products.length}`);

    // Initialize OpenAI client
    const openaiClient = createOpenAI({
      apiKey: apiKey,
    });

    // Stream response from OpenAI using Vercel AI SDK
    const result = await streamText({
      model: openaiClient('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[AI Chat] Error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // OpenAI rate limit error
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message:
              'Trop de requêtes. Veuillez réessayer dans quelques instants.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // OpenAI API error
      if (error.message.includes('API key')) {
        return new Response(
          JSON.stringify({
            error: 'API configuration error',
            message: 'Erreur de configuration de l\'API OpenAI.',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message:
          'Une erreur est survenue. Veuillez réessayer dans quelques instants.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
