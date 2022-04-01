import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ecs from '@aws-cdk/aws-ecs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as Etargets from '@aws-cdk/aws-events-targets';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as ssm from '@aws-cdk/aws-ssm';
import { Stack, StackProps } from '@aws-cdk/core';
import * as kms from '@aws-cdk/aws-kms';
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import { Port } from '@aws-cdk/aws-ec2';
import { ScalableTaskCount } from '@aws-cdk/aws-ecs';



export class ServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
       const environment = id.split("-")[2]
    const appname = id.split("-")[0]
    const namingpath = '/' + appname + '/' + environment
    const namingconvention = appname + "-" + environment

  
    const vpc = new ec2.Vpc(this, namingconvention+ "-"+ this.node.tryGetContext('vpcname'), {
      cidr: "10.0.0.0/26",
      maxAzs:2,
      enableDnsHostnames:true,
      enableDnsSupport:true,
      natGateways:2,      
   })
   // this tries to find EIP and print external ip address
vpc.publicSubnets.forEach((subnet, index) => {
  const EIP = subnet.node.tryFindChild('EIP') as ec2.CfnEIP
  new cdk.CfnOutput(this, `output-eip-${index}`, { value: EIP.ref });
})
    const ecsSG = new ec2.SecurityGroup(this, namingconvention+"-ecs-sg", {
      vpc, 
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true   // Can be set to false
    });
    
    // The code that defines your stack goes here

    const cluster = new ecs.Cluster(this, namingconvention+'-Cluster', {
      vpc,
      containerInsights: true,
    });

const execRole = new iam.Role(this, namingconvention + '-TaskExecutionRole-', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
})


execRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, namingconvention + "-managedPolicy", 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'))


    var fargate =new ecs_patterns.ApplicationLoadBalancedFargateService(this, namingconvention+"FargateService", {
      cluster: cluster, // Required
      cpu: 256, // Default is 256
      desiredCount: 1, // Default is 1
      taskImageOptions: {
        image:ecs.ContainerImage.fromAsset("docker/"),
        containerPort:8080,
        enableLogging:true
      },
      memoryLimitMiB: 512, // Default is 512
      publicLoadBalancer: true, // Default is false
      listenerPort: 80
    });

    const scaling=fargate.service.autoScaleTaskCount({
      maxCapacity:2,
      minCapacity:1,
    })
    scaling.scaleOnCpuUtilization("cpu-scaling",{ targetUtilizationPercent:80})

}
}
