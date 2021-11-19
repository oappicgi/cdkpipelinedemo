import { ServiceStack } from './service-stack';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Construct, Stage, Stack, StageProps } from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep,ManualApprovalStep } from "@aws-cdk/pipelines";
import * as ca from '@aws-cdk/aws-codepipeline-actions'
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import * as ssm from '@aws-cdk/aws-ssm';
import * as codecommit from '@aws-cdk/aws-codecommit';
import { ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import s3 = require('@aws-cdk/aws-s3');
import { ServerlessServiceStack } from './serverless-service-stack';



interface stageprops extends StageProps {
  appname:string
}
class ApplicationStageDev extends Stage {
  constructor(scope: Construct, id: string, props: stageprops) {
    super(scope, id, props);
    new ServiceStack(this, props.appname+'-service-'+"dev",{ env:props.env
    });
  }
}

class ApplicationStageProd extends Stage {
  constructor(scope: Construct, id: string, props: stageprops) {
    super(scope, id, props);
    new ServiceStack(this, props.appname+'-service-'+"prod",{ env:props.env
    });
  }
}

interface ServiceStackProps extends cdk.StackProps {

}
export class CICDStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);
    const appname = this.node.tryGetContext('appname')
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
  
    const repo = new codecommit.Repository(this, appname ,{      
      repositoryName: this.node.tryGetContext('codecommitname'),
      description: this.node.tryGetContext('codecommitname') + " repository"
      
  });
  if (this.node.tryGetContext('phase') != "init") {

    var branch = "master"

        const pipeline = new CodePipeline(this, appname+'-Pipeline', {
          crossAccountKeys:true,
          pipelineName: appname+'-Pipeline',
          synth: new ShellStep('Synth', {
            input: CodePipelineSource.codeCommit(repo, branch),
            commands: ['./zipper.sh','npm ci', 'npm run build', 'npx cdk synth'],            
          })
        });
    // This can be done to as many accounts and regions, however in this design we are following gitflow where each branch has own pipeline and we build everytime

   const deployStage = pipeline.addStage( new ApplicationStageDev(this, appname+"dev-deploy", {
      env: { account: this.node.tryGetContext('devaccountid'), region: this.node.tryGetContext('region') }, 
      appname:appname
    },
    )); 
    const proddeployStage = pipeline.addStage(new ApplicationStageProd(this, appname+"prod-deploy", {
      env: { account: this.node.tryGetContext('prodaccountid'), region: this.node.tryGetContext('region') },
      appname:appname    
    }));
    proddeployStage.addPre(new ManualApprovalStep('Pre-production check'))    
  }  else {
      new cdk.CfnOutput(this, `repoaddress`, { value: repo.repositoryCloneUrlGrc});
    }
  }
  }

