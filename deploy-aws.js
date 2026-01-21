// AWS CDK deployment script
// Run: npm install aws-cdk-lib constructs
// Then: cdk deploy

const { Stack, App, Duration } = require('aws-cdk-lib');
const { ApplicationLoadBalancedFargateService } = require('aws-cdk-lib/aws-ecs-patterns');
const { ContainerImage } = require('aws-cdk-lib/aws-ecs');

class AutoRagStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create Fargate service
    const fargateService = new ApplicationLoadBalancedFargateService(this, 'AutoRagService', {
      taskImageOptions: {
        image: ContainerImage.fromAsset('.'),
        containerPort: 3001,
        environment: {
          NODE_ENV: 'production',
          PORT: '3001',
          LLM_API_PORT: '8000'
        }
      },
      memoryLimitMiB: 2048,
      cpu: 1024,
      desiredCount: 1,
      publicLoadBalancer: true
    });

    // Health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200,404'
    });
  }
}

const app = new App();
new AutoRagStack(app, 'AutoRagStack');