import * as cdk from '@aws-cdk/core';
import { CfnOutput, Construct, StackProps, Stage } from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import * as origins from '@aws-cdk/aws-cloudfront-origins';


export class ServerlessServiceStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: StackProps) {
      super(scope, id, props);
      
      const myBucket = new s3.Bucket(this, 'frontBucket',{
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        publicReadAccess: true,
        websiteIndexDocument: 'index.html'
      });

      
 const frontendBucket = new s3deploy.BucketDeployment(this, 'DeployFiles', {
  sources: [s3deploy.Source.asset('./serverless/source.zip')],
  destinationBucket: myBucket,
});


    const cloudfrontDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(myBucket,{
         
        }),
        
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    new cdk.CfnOutput(this, `cloudfronturl:`, { value: cloudfrontDistribution.domainName});
}
}