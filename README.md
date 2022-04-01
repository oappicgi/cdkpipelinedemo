# Pipeline demo

This project contains template for deploying cdk stack with cicd pipeline from dev/qa account to prod account

# Steps required

## init
### Setup phase

do 
```
npm update 
```
in main folder to get all npm packages

in cdk.json there are multiple attributes you have to fill for your project. These include accountid for dev and prod and check others if you want to change them.

in init phase make sure phase attribute is set to init
This tells cicd stack that codecommit has to be created, which is required for cicd pipeline to work.

deploy with: 
```
npx cdk deploy
```
at this point you should get codecommit push address
go to your cdk.json file and change phase to develop

#### bootstrap your accounts

##### prod account trust
```
npx cdk bootstrap --profile account2-profile --trust ACCOUNT1  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://ACCOUNT2/REGION
```
##### dev account trust:
```
npx cdk bootstrap --profile account1-profile --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://ACCOUNT1/REGION
```
##### info
replace accountX-profile with profile in your credentials file, AccountX with id and Region with chosen region
you can add profile with assumed role credentials as long as you add secret-token info as well. That way you don't have to remember to remove them after pipeline has been deployed

#### init your git
Git can use your IAM credentials if you follow codecommit install instructions and install with 
```
pip install git-remote-codecommit
```
after installing codecommit remote tool push code to codecommit. You can then use address  outputted from npx cdk deploy 
```
git init
git remote add origin  codecomit_address
git add .
git commit -a -m "initial commit"
git push --set-upstream origin master
```


### Deploy pipeline
Now that we have code in git repository, and credentials in place we can finally create our pipeline with:
```
npx cdk deploy
```
For now own you shouldn't need to deploy anything as codepipeline can mutate itself and it pushes changes done to stacks and to application code.

in case there are errors make sure you have pushed cdk.context.json to your git repository. For what ever reason it cannot create AZ and account info inside pipeline.



# What example project are included:

I uploaded project with ServerlessServiceStack and default ServiceStack. Serverless is as name suggest serverless. Basically what it does is to add anything under serverless folder to S3 and adds cloudformation where S3 is origin. Check out cloudformation output for cloudformation url.

ServiceStack has golang app from https://github.com/lamw/demo-go-webapp repo inside docker folder. cicd basically creates docker image out of it, pushes it to ecr and serves it through autoscaled fargate service which it deploys to vpc that is also created in same stack


Now that you succesfully created pipeline you only need to push changes to git repository and any temperaty credentials that were created to bootstrap pipeline can be removed.
