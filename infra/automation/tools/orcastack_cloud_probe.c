#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    const char *name;
    const char *env_name;
    const char *fallback;
} Probe;

static const Probe probes[] = {
    {"proxmox", "ORCASTACK_PROXMOX_API", "https://proxmox.internal.example:8006"},
    {"openstack", "ORCASTACK_OPENSTACK_AUTH_URL", "https://keystone.internal.example:5000/v3"},
    {"rancher", "ORCASTACK_RANCHER_URL", "https://rancher.internal.example"},
    {"kubernetes", "ORCASTACK_KUBERNETES_API", "https://k8s.internal.example:6443"},
    {"observability", "ORCASTACK_GRAFANA_URL", "https://grafana.internal.example"}
};

static int has_flag(int argc, char **argv, const char *flag) {
    int index;

    for (index = 1; index < argc; ++index) {
        if (strcmp(argv[index], flag) == 0) {
            return 1;
        }
    }

    return 0;
}

int main(int argc, char **argv) {
    int summary_mode = has_flag(argc, argv, "--summary");
    int missing = 0;
    size_t index;

    if (summary_mode) {
        puts("ORCASTACK cloud probe summary");
    }

    for (index = 0; index < sizeof(probes) / sizeof(probes[0]); ++index) {
        const char *value = getenv(probes[index].env_name);

        if (value == NULL || value[0] == '\0') {
            value = probes[index].fallback;
            missing++;
        }

        if (summary_mode) {
            printf("- %s => %s\n", probes[index].name, value);
        } else {
            printf("%s=%s\n", probes[index].name, value);
        }
    }

    if (summary_mode && missing > 0) {
        printf("probe-result=fallback-config (%d defaults used)\n", missing);
    } else if (summary_mode) {
        puts("probe-result=fully-configured");
    }

    return 0;
}
