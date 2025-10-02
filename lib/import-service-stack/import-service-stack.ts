

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, 'ImportServiceBucket', {
        bucketName: `import-service-bucket-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'CreateUploadedFolder', {
      destinationBucket: importBucket,
      destinationKeyPrefix: 'uploaded/',
      sources: [s3deploy.Source.asset('./assets/uploaded')],
      });
      
  }
}
