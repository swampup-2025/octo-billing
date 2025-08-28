# Docker Copy with JF CLI cp

Copies a Docker image (manifest + blobs) between Artifactory repositories using `jf rt cp`.

Author: yevdoa

## Inputs
- `src-repo`: Source Docker repo name in Artifactory
- `dst-repo`: Destination Docker repo name in Artifactory
- `image`: Docker image path/name (e.g., `myorg/myapp`)
- `tag`: Docker tag

## Requirements
- JFrog CLI configured (e.g., via `jfrog/setup-jfrog-cli`)
- `jq` available on the runner (the action tries to install it if missing)

## Example usage
```yaml
- uses: ./.github/actions/docker-copy-with-cp
  with:
    src-repo: dev-docker-local
    dst-repo: prod-docker-local
    image: myorg/myapp
    tag: 1.2.3
```
