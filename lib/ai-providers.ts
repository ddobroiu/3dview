// Multiple AI providers for 3D generation
export type AIProvider = 'meshy' | 'luma' | 'tripo' | 'stability';

export interface GenerationConfig {
  provider: AIProvider;
  imageUrl: string;
  prompt?: string;
  quality: 'STANDARD' | 'HIGH' | 'ULTRA';
}

export interface GenerationResult {
  taskId?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  errorMessage?: string;
}

// Meshy AI Provider
export class MeshyProvider {
  private apiKey: string;
  private baseURL = 'https://api.meshy.ai/v1';

  constructor() {
    this.apiKey = process.env.MESHY_API_KEY || '';
  }

  async generate(config: GenerationConfig): Promise<GenerationResult> {
    const polycount = config.quality === 'ULTRA' ? 50000 : 
                    config.quality === 'HIGH' ? 20000 : 10000;

    const response = await fetch(`${this.baseURL}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: config.imageUrl,
        enable_pbr: true,
        surface_mode: 'organic',
        target_polycount: polycount,
        prompt: config.prompt || 'High quality 3D model'
      }),
    });

    if (!response.ok) {
      throw new Error(`Meshy API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      taskId: result.id,
      status: 'pending',
      progress: 0
    };
  }

  async checkStatus(taskId: string): Promise<GenerationResult> {
    const response = await fetch(`${this.baseURL}/image-to-3d/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Meshy API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      taskId,
      status: result.status === 'SUCCEEDED' ? 'completed' : 
              result.status === 'FAILED' ? 'failed' : 'processing',
      progress: result.progress || 0,
      modelUrl: result.model_url,
      thumbnailUrl: result.thumbnail_url,
      errorMessage: result.error_message
    };
  }
}

// Luma AI Provider
export class LumaProvider {
  private apiKey: string;
  private baseURL = 'https://api.lumalabs.ai/dream-machine/v1';

  constructor() {
    this.apiKey = process.env.LUMA_API_KEY || '';
  }

  async generate(config: GenerationConfig): Promise<GenerationResult> {
    const response = await fetch(`${this.baseURL}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: config.prompt || 'Create a detailed 3D model from this image',
        image: config.imageUrl,
        aspect_ratio: '1:1',
        quality: config.quality.toLowerCase()
      }),
    });

    if (!response.ok) {
      throw new Error(`Luma API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      taskId: result.id,
      status: 'pending',
      progress: 0
    };
  }

  async checkStatus(taskId: string): Promise<GenerationResult> {
    const response = await fetch(`${this.baseURL}/generations/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Luma API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      taskId,
      status: result.state === 'completed' ? 'completed' : 
              result.state === 'failed' ? 'failed' : 'processing',
      progress: result.progress || 0,
      modelUrl: result.assets?.model,
      thumbnailUrl: result.assets?.thumbnail,
      errorMessage: result.failure_reason
    };
  }
}

// Tripo AI Provider  
export class TripoProvider {
  private apiKey: string;
  private baseURL = 'https://api.tripo3d.ai/v2/openapi';

  constructor() {
    this.apiKey = process.env.TRIPO_API_KEY || '';
  }

  async generate(config: GenerationConfig): Promise<GenerationResult> {
    const response = await fetch(`${this.baseURL}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'image_to_model',
        image_url: config.imageUrl,
        model_version: config.quality === 'ULTRA' ? 'v2.0-20240919' : 'v1.4-20240625',
        generate_rig: config.quality !== 'STANDARD',
        generate_pbr: config.quality === 'ULTRA'
      }),
    });

    if (!response.ok) {
      throw new Error(`Tripo API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      taskId: result.data.task_id,
      status: 'pending',
      progress: 0
    };
  }

  async checkStatus(taskId: string): Promise<GenerationResult> {
    const response = await fetch(`${this.baseURL}/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Tripo API error: ${response.statusText}`);
    }

    const result = await response.json();
    const task = result.data;
    
    return {
      taskId,
      status: task.status === 'success' ? 'completed' : 
              task.status === 'failed' ? 'failed' : 'processing',
      progress: task.progress || 0,
      modelUrl: task.output?.model,
      thumbnailUrl: task.output?.rendered_image,
      errorMessage: task.error
    };
  }
}

// Provider Factory
export class AI3DProviderFactory {
  static create(provider: AIProvider) {
    switch (provider) {
      case 'meshy':
        return new MeshyProvider();
      case 'luma':
        return new LumaProvider();
      case 'tripo':
        return new TripoProvider();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

// Enhanced cost calculation based on provider
export const PROVIDER_COSTS = {
  meshy: {
    STANDARD: 1,  // $0.20 -> 1 credit
    HIGH: 2,      // $0.30 -> 2 credits  
    ULTRA: 3      // $0.40 -> 3 credits
  },
  luma: {
    STANDARD: 1,  // $0.10 -> 1 credit
    HIGH: 3,      // $0.25 -> 3 credits
    ULTRA: 5      // $0.50 -> 5 credits
  },
  tripo: {
    STANDARD: 1,  // $0.08 -> 1 credit
    HIGH: 2,      // $0.15 -> 2 credits  
    ULTRA: 3      // $0.25 -> 3 credits
  },
  stability: {
    STANDARD: 2,  // $0.15 -> 2 credits
    HIGH: 3,      // $0.25 -> 3 credits
    ULTRA: 4      // $0.40 -> 4 credits
  }
};

export function calculateProviderCost(provider: AIProvider, quality: 'STANDARD' | 'HIGH' | 'ULTRA'): number {
  return PROVIDER_COSTS[provider]?.[quality] || 1;
}