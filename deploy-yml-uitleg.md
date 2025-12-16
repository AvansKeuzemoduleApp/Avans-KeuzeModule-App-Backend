# Deploy Workflow

The `deploy.yml` workflow handles hosting our backend on a VPS. I use [Contabo](https://contabo.com/en/), but any VPS with [Docker](https://www.docker.com/) support works.

When you fork this repo, or come back to it in the future, you’ll need to set up your VPS and GitHub secrets to make deployment work.

---

## VPS Setup

Your VPS must:

1. Accept SSH connections from GitHub Actions.
2. Have Docker and Docker Compose installed.
3. Contain a directory for your app (`.env` and `docker-compose.yml`).
4. Allow GitHub Actions to SSH in, pull the latest image, and run it.

TIP: on Linux, `Ctrl` + `Shift` + `V` will paste your clipboard into the terminal.

### 1. Connect to Your VPS

```bash
ssh root@YOUR_SERVER_IP
```

---

### 2. Create a Deploy User

```bash
adduser deploy
usermod -aG docker deploy
```

---

### 3. Install Docker & Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
docker --version
docker compose version
```

---

### 4. Create Deployment Directory

Connect as `deploy`:

```bash
ssh deploy@YOUR_SERVER_IP
```

Then:

Make sure the casing is the same as your repo name

```bash
sudo mkdir -p /home/deploy/YOUR_REPO_NAME
sudo chown -R deploy:deploy /home/deploy/YOUR_REPO_NAME
```

---

### 5. Copy `.env` and `docker-compose.yml`

Make sure to replace my repo name in `docker-compose.yml` with yours. AND make sue it is lower case in here.

From your local machine:

```bash
scp .env docker-compose.yml deploy@YOUR_SERVER_IP:/home/deploy/YOUR_REPO_NAME/
```

If using `root` temporarily:

```bash
scp .env docker-compose.yml root@YOUR_SERVER_IP:/home/deploy/YOUR_REPO_NAME/
sudo chown deploy:deploy /home/deploy/YOUR_REPO_NAME/.env /home/deploy/YOUR_REPO_NAME/docker-compose.yml
```

---

### 6. Set Up SSH Key for GitHub Actions

Generate a key for GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions"
```

Copy the public key to VPS `deploy` user:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@YOUR_SERVER_IP
```

Keep the private key safe to add as a GitHub secret.

---

## Dockerfile

Make sure that the bottom line of the docker file is the command that you use for starting the app:

```
CMD ["npm", "run", "start:prod"]
```

If you changed the command, change it here too.


## How the Workflow Works

With this workflow, GitHub Actions will:

1. Build and push your Docker image to Docker Hub.
2. SSH into your VPS.
3. Pull the latest image.
4. Restart your containers via:

```bash
docker compose up -d --remove-orphans
```

5. Print the container status.

The only thing left is to set up GitHub secrets.

---

## GitHub User Secrets

This workflow uses [GitHub secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets) to securely store sensitive information, like your VPS credentials. Secrets prevent raw passwords or keys from being committed to your repository.

You need to set these secrets:

| Secret Name          | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Your [Docker Hub](https://hub.docker.com/repositories/) username, this can be found at the end of your `url`: `https://hub.docker.com/repositories/oldmartijntje`  means my username is `oldmartijntje`                               |
| `DOCKERHUB_TOKEN`    | Docker Hub password or access token                     |
| `SERVER_HOST`        | Your VPS IP address or hostname                         |
| `SERVER_USER`        | VPS deploy username (e.g., `deploy`)                    |
| `SSH_PRIVATE_KEY`    | Private SSH key corresponding to your public key on VPS, generated in step 6 |
| `SERVER_SSH_PORT`    | SSH port of your VPS (default: 22)                      |
| `SSH_PASSPHRASE`    | The password you have set to your SSH, can be ignored if you did not set any  |

If you’re unsure how to set secrets, see [user_secrets.md](./user_secrets.md).

## VPS Remove

In some cases, you want to remove your things from your VPS. Like me, hosting this for school.

If you no longer want your app on the VPS, you can remove it step by step. All steps are optional, but doing them in order ensures a clean removal.

---

### 1. Stop and Remove Containers (Optional)

If your app is running via Docker Compose:

```bash
ssh deploy@YOUR_SERVER_IP
cd /home/deploy/YOUR_REPO_NAME
docker compose down
```

> ⚠️ Note: Step 4 (removing Docker) will also remove all containers, so this step is optional if you plan to uninstall Docker.

---

### 2. Remove App Files (Optional)

Delete `.env`, `docker-compose.yml`, and other project files:

```bash
rm -rf /home/deploy/YOUR_REPO_NAME
```

> Make sure you’re deleting the correct directory. This won’t affect Docker containers if they’re running.

---

### 3. Remove SSH Key from VPS (Optional)

If you set up a GitHub Actions key, remove it from the `authorized_keys`:

```bash
ssh deploy@YOUR_SERVER_IP
nano ~/.ssh/authorized_keys
# delete the line with GitHub Actions key
```

Or via command line:

```bash
ssh deploy@YOUR_SERVER_IP "sed -i '/github-actions/d' ~/.ssh/authorized_keys"
```

---

### 4. Remove Deploy User (Optional)

If you want to remove the user entirely:

```bash
ssh root@YOUR_SERVER_IP
deluser --remove-home deploy
```

> ⚠️ Removing the user will also remove their home directory unless you’ve already deleted it manually.

---

### 5. Uninstall Docker & Compose (Optional)

If you want to completely remove Docker from your VPS:

```bash
ssh root@YOUR_SERVER_IP
apt purge -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
apt autoremove -y
rm -rf /var/lib/docker /etc/docker
```

> ⚠️ This will also remove all containers, images, and volumes.

---

This order ensures:

1. Running containers are stopped before files are deleted.
2. SSH keys are cleaned up before deleting the deploy user.
3. Docker removal cleans up any leftovers automatically.