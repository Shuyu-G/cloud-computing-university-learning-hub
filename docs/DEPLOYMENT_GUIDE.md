# AWS Deployment Guide

This file follows the same order as the PDF and maps each AWS step to the files in this repository.

## Phase 1. AWS account and IAM

1. Create the AWS account and switch to `us-east-1`.
2. Create IAM user `elearn-admin`.
3. Sign in with the IAM user before creating resources.

## Phase 2. VPC and networking

Create the VPC exactly as the PDF specifies:

- VPC name: `elearning-platform-vpc`
- CIDR: `10.0.0.0/16`
- 2 public subnets
- 2 private subnets
- No NAT gateways

Create these security groups:

- `ec2-elearn-sg`
  - SSH `22` from `My IP`
  - HTTP `80` from `0.0.0.0/0`
  - Custom TCP `3000` from `0.0.0.0/0`
- `rds-elearn-sg`
  - MySQL `3306` from `ec2-elearn-sg`

## Phase 3. Launch EC2

1. Launch Amazon Linux 2023 on `t2.micro`.
2. Attach `ec2-elearn-sg`.
3. Enable public IP.
4. Download the PEM key pair.

SSH command:

```bash
chmod 400 elearn-keypair.pem
ssh -i elearn-keypair.pem ec2-user@YOUR_PUBLIC_IP
```

## Phase 4. Install the app on EC2

On the EC2 instance:

```bash
sudo dnf update -y
sudo dnf install -y nodejs git mysql
```

Copy this project onto the instance, then run:

```bash
cd elearn-app
npm install
cp .env.example .env
```

Edit `.env` with your RDS endpoint and S3 bucket name.
The app loads `.env` automatically, so you can start it directly with `npm start`.

## Phase 5. Create S3 bucket

1. Create bucket `elearning-platform-files-YOURNAME`.
2. Keep public access blocked.
3. Enable SSE-S3 encryption.
4. Upload a sample course file.

Create and attach IAM role `ec2-elearn-s3-role` with `AmazonS3FullAccess` to the EC2 instance.

After that, the app will expose the bucket contents at `/files`.

## Phase 6. Create RDS

1. Create DB subnet group `elearn-db-subnet-group`.
2. Use both private subnets.
3. Launch MySQL 8.0 Free Tier instance:
   - Identifier: `elearning-database`
   - Username: `admin`
   - Password: `ELearnPass123!`
   - DB name: `elearndb`
   - Public access: `No`
   - Security group: `rds-elearn-sg`

## Phase 7. Connect the app

Run the schema:

```bash
mysql -h YOUR_RDS_ENDPOINT -u admin -p < sql/schema.sql
```

Populate `.env`:

```bash
PORT=3000
AWS_REGION=us-east-1
S3_BUCKET_NAME=elearning-platform-files-YOURNAME
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_USER=admin
DB_PASS=ELearnPass123!
DB_NAME=elearndb
```

Start the app:

```bash
npm start
```

Optional PM2 setup:

```bash
sudo npm install -g pm2
pm2 start app.js --name elearn-app
pm2 startup
pm2 save
```

## Phase 8. Verification checklist

Verify these URLs and resources:

- `http://YOUR_EC2_IP:3000/`
- `http://YOUR_EC2_IP:3000/students`
- `http://YOUR_EC2_IP:3000/quiz`
- `http://YOUR_EC2_IP:3000/files`
- `http://YOUR_EC2_IP:3000/health`

Expected results:

- Home page loads.
- Enrolment inserts records into RDS.
- Students page reads live data from RDS.
- Quiz returns a score.
- Files page lists objects from S3.
- Health endpoint shows DB and S3 connectivity state.

## Phase 9. Cleanup

After the demo, delete:

1. RDS instance.
2. RDS subnet group.
3. EC2 instance.
4. S3 bucket contents, then the bucket.
5. Security groups.
6. VPC.
7. IAM role.
