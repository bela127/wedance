<template>
  <main>
    <TPopup v-if="showAuthPopup">
      <div class="flex justify-between border-b pb-2 mb-4">
        <div class="font-bold">Members only</div>
        <button class="cursor-pointer" @click="showAuthPopup = false">
          <TIcon name="close" class="cursor-pointer w-4 h-4" />
        </button>
      </div>
      <div class="my-4 flex flex-col justify-center">
        <div>Chat is available only for members</div>
        <TButton class="mt-2" to="/signin?target=/feed">Become Member</TButton>
      </div>
    </TPopup>

    <TTitle>
      Feed
      <template slot="right">
        <div v-if="city && city.telegram">
          <div class="my-4 flex justify-center">
            <TButton v-if="uid" :href="city.telegram" class="flex items-center">
              <TIcon name="telegram" class="w-4 h-4 text-black mr-2" />
              Join {{ city.name }} Dance Chat
            </TButton>
            <TButton
              v-else
              class="flex items-center"
              @click="showAuthPopup = true"
            >
              <TIcon name="telegram" class="w-4 h-4 text-black mr-2" />
              Join {{ city.name }} Dance Chat
            </TButton>
          </div>
        </div>
      </template>
    </TTitle>

    <div>
      <div v-if="false" class="rounded bg-orange-200 p-4 mb-4">
        <div class="uppercase font-bold">New Challenge</div>
        <div>
          Share your favourite music of your favourite dance
          <span class="text-blue-500">#FavouriteMusic</span>
        </div>
        <div class="flex justify-end mt-4">
          <TButton to="/posts/-/edit?tag=FavouriteMusic"
            >Accept Challenge</TButton
          >
        </div>
      </div>
      <TLoader v-if="loading" />
      <div v-else-if="!filteredItems.length">No posts found</div>
      <TPopup v-if="reportId">
        <div class="font-bold mb-4">Report a post</div>
        <TSelect
          v-model="reportCategory"
          label="Category"
          type="select"
          :options="['other', 'spam']"
        />
        <TField v-model="reportReason" class="mt-2" label="Reason" />
        <div class="mt-4 flex justify-end">
          <TButton class="mr-2" @click="cancelReport">Cancel</TButton>
          <TButton type="danger" @click="report">Report</TButton>
        </div>
      </TPopup>
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="rounded bg-white mb-4 shadow border"
      >
        <div class="p-4">
          <div>
            <div>
              <router-link
                :to="`/posts/${item.id}`"
                class="font-bold leading-tight"
                >{{ item.title }}</router-link
              >
              <div class="float-right -mr-2">
                <TMenu>
                  <template v-slot:button>
                    <TIcon
                      class="cursor-pointer rounded-full hover:bg-gray-200 p-1"
                      name="more_vert"
                    />
                  </template>
                  <template v-slot:menu="{ closeMenu }">
                    <div class="w-32 py-2 bg-white rounded-lg shadow-xl border">
                      <TButton
                        type="nav"
                        @click="
                          reportId = item.id
                          closeMenu()
                        "
                        >Report</TButton
                      >
                    </div>
                  </template>
                </TMenu>
              </div>
            </div>

            <div class="text-xs my-1 flex items-center">
              <TAvatar class="mr-2" photo size="sm" :uid="item.createdBy" />
              <TAvatar class="mr-2" name :uid="item.createdBy" />
              <router-link
                :to="`/posts/${item.id}`"
                class="text-xs text-gray-600 hover:underline text-right"
                >{{ dateDiff(item.createdAt) }} ago</router-link
              >
            </div>

            <TPreview
              v-if="!item.link"
              class="mt-2"
              :content="item.description"
              :excerpt="true"
            />

            <Microlink v-if="item.link" class="mt-2 z-0" :url="item.link" />
          </div>
        </div>
        <div class="px-4 pb-4 md:flex items-center justify-between">
          <TTagsPreview :value="item.tags" class="mb-4 md:mb-0" />

          <div class="flex">
            <div class="text-green-500 flex justify-center">
              <button
                class="text-center hover:text-green-500"
                :class="{ 'text-green-700': item.response === 'up' }"
                @click="updateRsvp(item.id, 'posts', 'up')"
              >
                <TIcon name="up" class="h-6 w-6" />
              </button>
              <div>{{ item.upVotes }}</div>
            </div>
            <div class="text-red-500 flex ml-2 justify-center">
              <button
                class="text-center hover:text-primary"
                :class="{ 'text-red-700': item.response === 'down' }"
                @click="updateRsvp(item.id, 'posts', 'down')"
              >
                <TIcon name="down" class="h-6 w-6 hover:text-primary" />
              </button>
              <div>{{ item.downVotes }}</div>
            </div>
            <div class="text-gray-700 flex ml-4 justify-center">
              <router-link :to="`/posts/${item.id}`" class="flex">
                <TIcon name="chat" class="h-6 w-6 hover:text-primary" />
                <span>{{ item.commentsCount }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { computed } from '@nuxtjs/composition-api'
import { Microlink } from '@microlink/vue'
import useRSVP from '~/use/rsvp'
import useComments from '~/use/comments'
import useCollection from '~/use/collection'
import useAccounts from '~/use/accounts'
import useCities from '~/use/cities'
import useAuth from '~/use/auth'
import useDoc from '~/use/doc'
import { dateDiff, sortBy } from '~/utils'

export default {
  name: 'PostsIndex',
  components: {
    Microlink
  },
  setup() {
    const {
      getCount,
      getRsvpResponse,
      updateRsvp,
      loading: loadingLikes
    } = useRSVP()
    const { getCommentsCount, loading: loadingComments } = useComments()
    const { currentCity, city } = useCities()
    const { docs, loading: loadingPosts, getById } = useCollection('posts')
    const { create: createReport } = useDoc('reports')
    const { uid } = useAuth()

    const map = (item) => {
      if (!item.id) {
        return {}
      }

      const upVotes = getCount(item.id, 'up')
      const downVotes = getCount(item.id, 'down')
      const votes = upVotes - downVotes
      const response = getRsvpResponse(item.id)
      const multi = !response ? 3 : response === 'up' ? 2 : 1
      const order = multi * 100 + votes
      const commentsCount = getCommentsCount(item.id)

      return {
        ...item,
        commentsCount,
        upVotes,
        downVotes,
        votes,
        response,
        order
      }
    }

    const items = computed(() => docs.value.map(map))
    const loading = computed(
      () => loadingLikes.value && loadingComments.value && loadingPosts.value
    )

    const { getAccount } = useAccounts()

    return {
      city,
      items,
      getRsvpResponse,
      updateRsvp,
      dateDiff,
      getAccount,
      loading,
      createReport,
      getById,
      uid,
      currentCity
    }
  },
  data: () => ({
    showAuthPopup: false,
    reportId: 0,
    reportReason: '',
    reportCategory: 'other'
  }),
  computed: {
    filteredItems() {
      return this.items
        .filter(
          (item) => !item.community || item.community === this.currentCity
        )
        .filter((item) =>
          this.$route.query.tag
            ? item.tags && item.tags[this.$route.query.tag]
            : true
        )
        .sort(sortBy('-createdAt'))
    }
  },
  methods: {
    cancelReport() {
      this.reportId = 0
      this.reportReason = ''
      this.reportCategory = 'other'
    },
    report(item) {
      this.createReport({
        state: 'open',
        documentId: this.reportId,
        category: this.reportCategory,
        collection: 'posts',
        reason: this.reportReason,
        documentData: this.getById(this.reportId)
      })
      this.cancelReport()
    }
  }
}
</script>
